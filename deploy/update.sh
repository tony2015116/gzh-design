#!/usr/bin/env bash
# Run as root. Git and npm run as the application's dedicated user.
set -Eeuo pipefail

main() {
  local project_dir="${GZH_PROJECT_DIR:-/home/gzh/gongzhonghao}"
  local run_user="${GZH_RUN_USER:-gzh}"
  local service="${GZH_SERVICE_NAME:-gzh-typesetter}"
  local branch="${GZH_BRANCH:-master}"
  local node_bin="${GZH_NODE_BIN:-/usr/bin/node}"
  local health_url="${GZH_HEALTH_URL:-http://127.0.0.1:3100/health}"
  local lock_file="${GZH_UPDATE_LOCK:-/run/gzh-update.lock}"
  local stage="检查环境" stopped=0

  fail() { printf '\n错误：%s\n' "$*" >&2; exit 1; }
  as_user() { runuser -u "$run_user" -- env PATH="$(dirname "$node_bin"):/usr/local/bin:/usr/bin:/bin" "$@"; }
  trap 'status=$?; printf "\n更新失败，阶段：%s。请修复报错后重新执行脚本。\n" "$stage" >&2; if (( stopped )); then printf "服务保持停止，避免运行未完成的构建。\n" >&2; fi; exit "$status"' ERR

  [[ "$(id -u)" == 0 ]] || fail "请使用 root 执行：bash /home/gzh/gongzhonghao/deploy/update.sh"
  local required_command
  for required_command in runuser git systemctl curl flock; do
    command -v "$required_command" >/dev/null || fail "缺少命令：$required_command"
  done
  id "$run_user" >/dev/null 2>&1 || fail "运行用户不存在：$run_user"
  [[ -e "$project_dir/.git" && -d "$project_dir/app" && -d "$project_dir/server" ]] || fail "项目目录不完整：$project_dir"
  [[ -f "$project_dir/server/.env" ]] || fail "缺少 server/.env，请先完成首次部署配置。"
  [[ "$(systemctl show --property=LoadState --value "$service")" == loaded ]] || fail "服务尚未安装：$service"
  exec 9>"$lock_file"
  flock -n 9 || fail "已有更新任务正在执行，请稍后再试。"

  local changes current_branch
  changes="$(as_user git -C "$project_dir" status --porcelain --untracked-files=no)"
  [[ -z "$changes" ]] || fail "项目有未提交的代码修改，请先处理；脚本不会覆盖这些修改。"
  current_branch="$(as_user git -C "$project_dir" symbolic-ref --short HEAD)"
  [[ "$current_branch" == "$branch" ]] || fail "当前分支不是 $branch，请先核对部署分支。"
  as_user "$node_bin" --version
  as_user npm --version

  stage="拉取代码"
  printf '\n[1/4] 以 %s 拉取 origin/%s\n' "$run_user" "$branch"
  as_user git -C "$project_dir" pull --ff-only origin "$branch"

  stage="构建前端"
  printf '\n[2/4] 停止本项目，以 %s 安装依赖并构建前端\n' "$run_user"
  systemctl stop "$service"
  stopped=1
  as_user npm --prefix "$project_dir/app" ci
  as_user npm --prefix "$project_dir/app" run build:server

  stage="构建后端"
  printf '\n[3/4] 以 %s 安装依赖并构建后端\n' "$run_user"
  as_user npm --prefix "$project_dir/server" ci
  as_user npm --prefix "$project_dir/server" run build

  stage="重启与健康检查"
  printf '\n[4/4] 重启 %s，检查 %s\n' "$service" "$health_url"
  systemctl restart "$service"
  stopped=0
  local attempt body
  for attempt in {1..15}; do
    if systemctl is-active --quiet "$service" && body="$(curl --noproxy '*' --fail --silent --show-error --connect-timeout 2 --max-time 3 "$health_url" 2>/dev/null)"; then
      if [[ "$body" =~ \"status\"[[:space:]]*:[[:space:]]*\"ok\" ]]; then
        printf '\n更新成功，服务运行正常。浏览器可按 Ctrl+Shift+R 刷新。\n'
        return 0
      fi
    fi
    sleep 1
  done
  systemctl status "$service" --no-pager -l || true
  journalctl -u "$service" -n 30 --no-pager || true
  fail "健康检查未通过，请根据上面的服务日志排查。"
}

# Keep the running procedure in memory if git pull replaces this script.
main "$@"; exit
