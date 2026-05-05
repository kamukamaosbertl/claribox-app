import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const SENTIMENTS = [
  {
    key: 'positive',
    label: 'Positive',
    emoji: '😊',
    color: '#22C55E',
    light: '#DCFCE7',
    text: '#15803D',
  },
  {
    key: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    color: '#F59E0B',
    light: '#FEF3C7',
    text: '#B45309',
  },
  {
    key: 'negative',
    label: 'Negative',
    emoji: '😞',
    color: '#EF4444',
    light: '#FEE2E2',
    text: '#B91C1C',
  },
];

const EMOTION_META = {
  joy: {
    label: 'Joy',
    emoji: '😊',
    color: '#16A34A',
    light: '#DCFCE7',
  },
  anger: {
    label: 'Anger',
    emoji: '😠',
    color: '#DC2626',
    light: '#FEE2E2',
  },
  sadness: {
    label: 'Sadness',
    emoji: '😔',
    color: '#2563EB',
    light: '#DBEAFE',
  },
  fear: {
    label: 'Fear',
    emoji: '😟',
    color: '#7C3AED',
    light: '#EDE9FE',
  },
  surprise: {
    label: 'Surprise',
    emoji: '😮',
    color: '#F59E0B',
    light: '#FEF3C7',
  },
  disgust: {
    label: 'Disgust',
    emoji: '🤢',
    color: '#65A30D',
    light: '#ECFCCB',
  },
  neutral: {
    label: 'Neutral',
    emoji: '😐',
    color: '#64748B',
    light: '#F1F5F9',
  },
};

const formatLabel = (value = '') => {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getEmotionMeta = (key) => {
  return (
    EMOTION_META[key] || {
      label: formatLabel(key),
      emoji: '💬',
      color: '#64748B',
      light: '#F1F5F9',
    }
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
        fontFamily: font,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          fontWeight: 800,
          color: '#0F172A',
        }}
      >
        {payload[0].name}
      </p>

      <p
        style={{
          margin: '3px 0 0',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        {payload[0].value} submissions
      </p>
    </div>
  );
};

const EmptyState = () => (
  <div
    style={{
      minHeight: '260px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 32px',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      fontFamily: font,
    }}
  >
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        marginBottom: '20px',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MessageSquare size={24} color="#2563EB" />
    </div>

    <h3
      style={{
        fontSize: '16px',
        fontWeight: 800,
        color: '#0F172A',
        margin: '0 0 8px',
      }}
    >
      No Sentiment Data Yet
    </h3>

    <p
      style={{
        fontSize: '13px',
        color: '#64748B',
        margin: 0,
        lineHeight: '1.6',
        maxWidth: '300px',
      }}
    >
      Sentiment and emotion insights will appear once feedback is submitted.
    </p>
  </div>
);

const EmotionBreakdown = ({ emotions }) => {
  const emotionData = Object.entries(emotions || {})
    .map(([key, count]) => {
      const meta = getEmotionMeta(key);

      return {
        key,
        count: Number(count) || 0,
        ...meta,
      };
    })
    .filter((emotion) => emotion.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = emotionData.reduce((sum, emotion) => sum + emotion.count, 0);

  if (!emotionData.length || total === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '22px',
          fontFamily: font,
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#94A3B8',
          }}
        >
          Emotion Breakdown
        </p>

        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#64748B',
            lineHeight: '1.6',
          }}
        >
          No emotion data has been detected yet.
        </p>
      </div>
    );
  }

  const dominant = emotionData[0];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: '22px',
        fontFamily: font,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#94A3B8',
            }}
          >
            Emotion Breakdown
          </p>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: '#0F172A',
            }}
          >
            What students are actually feeling
          </p>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '999px',
            padding: '6px 12px',
            background: dominant.light,
            color: dominant.color,
            fontSize: '12px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{dominant.emoji}</span>
          {dominant.label} leads
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {emotionData.map((emotion) => {
          const pct = Math.round((emotion.count / total) * 100);

          return (
            <div key={emotion.key}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '7px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{emotion.emoji}</span>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    {emotion.label}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#64748B',
                    }}
                  >
                    {emotion.count}
                  </span>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      color: emotion.color,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: '8px',
                  borderRadius: '999px',
                  background: emotion.light,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '999px',
                    background: emotion.color,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SentimentAnalysis = ({ sentimentData }) => {
  const total =
    (Number(sentimentData?.positive) || 0) +
    (Number(sentimentData?.neutral) || 0) +
    (Number(sentimentData?.negative) || 0);

  if (!sentimentData || total === 0) return <EmptyState />;

  const chartData = SENTIMENTS.map((sentiment) => ({
    name: sentiment.label,
    value: Number(sentimentData?.[sentiment.key]) || 0,
    color: sentiment.color,
    light: sentiment.light,
    text: sentiment.text,
    emoji: sentiment.emoji,
  })).filter((item) => item.value > 0);

  const dominant = chartData.reduce(
    (prev, current) => (current.value > prev.value ? current : prev),
    chartData[0]
  );

  return (
    <div
      style={{
        fontFamily: font,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '360px',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#94A3B8',
            }}
          >
            Sentiment Distribution
          </p>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: '#0F172A',
            }}
          >
            Overall feedback tone
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            height: '230px',
            marginTop: '14px',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '30px',
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.04em',
              }}
            >
              {total}
            </p>

            <p
              style={{
                margin: '2px 0 0',
                fontSize: '10px',
                fontWeight: 800,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              feedback
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '14px',
          }}
        >
          {SENTIMENTS.map((sentiment) => {
            const value = Number(sentimentData?.[sentiment.key]) || 0;
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;

            return (
              <div
                key={sentiment.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 10px',
                  borderRadius: '999px',
                  background: sentiment.light,
                  color: sentiment.text,
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                <span>{sentiment.emoji}</span>
                <span>{sentiment.label}</span>
                <span>{pct}%</span>
              </div>
            );
          })}
        </div>

        {dominant && (
          <div
            style={{
              marginTop: '18px',
              padding: '14px',
              borderRadius: '16px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#475569',
                lineHeight: '1.6',
              }}
            >
              Dominant sentiment:{' '}
              <strong style={{ color: '#0F172A' }}>
                {dominant.emoji} {dominant.name}
              </strong>
            </p>
          </div>
        )}
      </div>

      <EmotionBreakdown emotions={sentimentData?.emotions} />
    </div>
  );
};

export default SentimentAnalysis;