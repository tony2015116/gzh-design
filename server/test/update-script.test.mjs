import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,chmod} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,basename} from 'node:path';
import {spawnSync} from 'node:child_process';

const bash=process.env.BASH_BIN||(process.platform==='win32'?'D:/software/Git/bin/bash.exe':'/bin/bash');
const script=resolve(import.meta.dirname,'../../deploy/update.sh').replaceAll('\\','/');
const shell=(args,env={})=>spawnSync(bash,args,{encoding:'utf8',env:{...process.env,...env},timeout:15000});

test('Linux update script has valid Bash syntax',{skip:!existsSync(bash)},()=>{
 const result=shell(['-n',script]);assert.equal(result.status,0,result.stderr);
});

test('update script switches execution identity and stops safely on failures',{skip:!existsSync(bash)},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-updater-'));
 try{
  const project=join(dir,'project'),bin=join(dir,'bin'),log=join(dir,'commands.log');
  await mkdir(bin);for(const child of ['.git','app','server'])await mkdir(join(project,child),{recursive:true});
  const envFile=join(project,'server/.env');await writeFile(envFile,'PORT=3100\nPRIVATE_FIXTURE=keep-me\n');
  const mocks={
   id:'if [[ "${1:-}" == "-u" ]]; then echo "${GZH_TEST_UID:-0}"; fi',
   runuser:`printf 'runuser %s\\n' "$*" >> "$GZH_TEST_LOG"
if [[ "$*" == *"status --porcelain"* && "\${GZH_TEST_DIRTY:-0}" == 1 ]]; then echo ' M app/package.json'; fi
if [[ "$*" == *"symbolic-ref --short HEAD"* ]]; then echo master; fi
if [[ "$*" == *"--version"* ]]; then echo v22.22.2; fi
if [[ -n "\${GZH_TEST_FAIL_MATCH:-}" && "$*" == *"$GZH_TEST_FAIL_MATCH"* ]]; then exit 7; fi`,
   systemctl:`printf 'systemctl %s\\n' "$*" >> "$GZH_TEST_LOG"
if [[ "\${1:-}" == show ]]; then echo loaded; fi`,
   curl:`printf 'curl %s\\n' "$*" >> "$GZH_TEST_LOG"
if [[ "\${GZH_TEST_HEALTH_FAIL:-0}" == 1 ]]; then exit 22; fi
printf '{"status":"ok"}'`,
   flock:'[[ "${GZH_TEST_LOCKED:-0}" != 1 ]]',
   sleep:':',journalctl:':',
  };
  for(const [name,body]of Object.entries(mocks)){const file=join(bin,name);await writeFile(file,'#!/usr/bin/env bash\n'+body+'\n');await chmod(file,0o755);}
  const baseEnv={GZH_PROJECT_DIR:project.replaceAll('\\','/'),GZH_UPDATE_LOCK:join(dir,'update.lock').replaceAll('\\','/'),GZH_MOCK_BIN:bin.replaceAll('\\','/'),GZH_TEST_LOG:log.replaceAll('\\','/'),GZH_SCRIPT:script};
  const command=process.platform==='win32'?'export PATH="$(cygpath -u "$GZH_MOCK_BIN"):$PATH"; exec bash "$GZH_SCRIPT"':'export PATH="$GZH_MOCK_BIN:$PATH"; exec bash "$GZH_SCRIPT"';
  const run=async overrides=>{await writeFile(log,'');const result=shell(['-c',command],{...baseEnv,...overrides});return {...result,commands:await readFile(log,'utf8')};};
  let result=await run({});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/更新成功/);
  const expected=['pull --ff-only origin master','systemctl stop gzh-typesetter',`--prefix ${baseEnv.GZH_PROJECT_DIR}/app ci`,'run build:server',`--prefix ${baseEnv.GZH_PROJECT_DIR}/server ci`,'run build','systemctl restart gzh-typesetter','curl'];
  let offset=0;for(const part of expected){const index=result.commands.indexOf(part,offset);assert.ok(index>=offset,part+'\n'+result.commands);offset=index+part.length;}
  assert.ok(result.commands.split('\n').filter(line=>line.includes('npm ')).every(line=>line.startsWith('runuser -u gzh --')));
  for(const overrides of [{GZH_TEST_DIRTY:'1'},{GZH_TEST_FAIL_MATCH:'pull --ff-only'}]){result=await run(overrides);assert.notEqual(result.status,0);assert.doesNotMatch(result.commands,/systemctl stop|npm .* ci|systemctl restart/);}
  result=await run({GZH_TEST_FAIL_MATCH:'run build:server'});assert.notEqual(result.status,0);assert.match(result.commands,/systemctl stop/);assert.doesNotMatch(result.commands,/systemctl restart/);
  result=await run({GZH_TEST_HEALTH_FAIL:'1'});assert.notEqual(result.status,0);assert.match(result.stderr,/健康检查/);
  for(const overrides of [{GZH_TEST_UID:'1000'},{GZH_TEST_LOCKED:'1'}]){result=await run(overrides);assert.notEqual(result.status,0);assert.doesNotMatch(result.commands,/pull --ff-only|systemctl stop/);}
  assert.equal(await readFile(envFile,'utf8'),'PORT=3100\nPRIVATE_FIXTURE=keep-me\n');
 }finally{
  assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.ok(basename(dir).startsWith('gzh-updater-'));
  await rm(dir,{recursive:true,force:true});
 }
});
