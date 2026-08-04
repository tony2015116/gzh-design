import type { CSSProperties } from 'react';

export const COVER_WIDTH = 1080;
export const COVER_HEIGHT = 1440;

export type CoverTemplateId = 'poster' | 'note' | 'split' | 'mark';

export const COVER_TEMPLATES: { id: CoverTemplateId; name: string }[] = [
  { id: 'poster', name: '大字报' },
  { id: 'note', name: '便签纸' },
  { id: 'split', name: '撞色分割' },
  { id: 'mark', name: '荧光笔记' },
];

export const COVER_COLORS = [
  '#FF2442',
  '#FF7A00',
  '#F5A623',
  '#059669',
  '#2563EB',
  '#7C3AED',
  '#111827',
];

interface CoverTemplateProps {
  title: string;
  subtitle: string;
  template: CoverTemplateId;
  accentColor: string;
}

const FONT_FAMILY =
  "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

const baseStyle: CSSProperties = {
  width: COVER_WIDTH,
  height: COVER_HEIGHT,
  position: 'relative',
  overflow: 'hidden',
  fontFamily: FONT_FAMILY,
  boxSizing: 'border-box',
};

function PosterCover({ title, subtitle, accentColor }: CoverTemplateProps) {
  return (
    <div style={{ ...baseStyle, background: accentColor }}>
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          right: 40,
          bottom: 40,
          border: '4px solid rgba(255,255,255,0.55)',
          borderRadius: 28,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          right: 40,
          bottom: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 70px',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 100,
            fontWeight: 900,
            lineHeight: 1.3,
            wordBreak: 'break-all',
            textShadow: '0 6px 24px rgba(0,0,0,0.18)',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 64,
              alignSelf: 'flex-start',
              background: '#FFFFFF',
              color: accentColor,
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.4,
              padding: '22px 40px',
              borderRadius: 16,
              wordBreak: 'break-all',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCover({ title, subtitle, accentColor }: CoverTemplateProps) {
  return (
    <div
      style={{
        ...baseStyle,
        background:
          'radial-gradient(circle at 20% 15%, #FBF7EE 0%, #F4EDDD 55%, #EDE3CD 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 880,
          minHeight: 760,
          background: '#FFFFFF',
          borderRadius: 10,
          boxShadow: '0 30px 70px rgba(90,70,40,0.28)',
          transform: 'rotate(-1.5deg)',
          padding: '110px 76px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -34,
            left: '50%',
            width: 320,
            height: 68,
            transform: 'translateX(-50%) rotate(-4deg)',
            background: accentColor,
            opacity: 0.72,
            borderRadius: 4,
            boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
          }}
        />
        <div
          style={{
            color: '#1F2937',
            fontSize: 82,
            fontWeight: 900,
            lineHeight: 1.35,
            wordBreak: 'break-all',
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 130,
            height: 12,
            borderRadius: 6,
            background: accentColor,
            marginTop: 46,
          }}
        />
        {subtitle && (
          <div
            style={{
              marginTop: 40,
              color: '#6B7280',
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.5,
              wordBreak: 'break-all',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function SplitCover({ title, subtitle, accentColor }: CoverTemplateProps) {
  return (
    <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'relative',
          height: 840,
          background: accentColor,
          padding: '0 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 56,
            color: 'rgba(255,255,255,0.28)',
            fontSize: 260,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}
        >
          &ldquo;
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.32,
            wordBreak: 'break-all',
            paddingBottom: 76,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          background: '#111827',
          padding: '64px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 110,
            height: 12,
            borderRadius: 6,
            background: accentColor,
          }}
        />
        {subtitle && (
          <div
            style={{
              marginTop: 40,
              color: '#E5E7EB',
              fontSize: 42,
              fontWeight: 600,
              lineHeight: 1.5,
              wordBreak: 'break-all',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkCover({ title, subtitle, accentColor }: CoverTemplateProps) {
  return (
    <div style={{ ...baseStyle, background: '#FFFFFF', padding: '0 84px' }}>
      <div
        style={{
          position: 'absolute',
          right: -140,
          bottom: -140,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.08,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 90,
          bottom: 90,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: accentColor,
          opacity: 0.12,
        }}
      />
      <div style={{ display: 'flex', gap: 18, paddingTop: 96 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: accentColor,
              opacity: 1 - i * 0.3,
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 330,
          color: '#111827',
          fontSize: 94,
          fontWeight: 900,
          lineHeight: 1.45,
          wordBreak: 'break-all',
          backgroundImage: `linear-gradient(transparent 64%, ${accentColor}59 64%, ${accentColor}59 94%, transparent 94%)`,
          display: 'inline',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          padding: '0 6px',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 56,
            color: '#4B5563',
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1.5,
            wordBreak: 'break-all',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function CoverTemplate(props: CoverTemplateProps) {
  switch (props.template) {
    case 'note':
      return <NoteCover {...props} />;
    case 'split':
      return <SplitCover {...props} />;
    case 'mark':
      return <MarkCover {...props} />;
    case 'poster':
    default:
      return <PosterCover {...props} />;
  }
}
