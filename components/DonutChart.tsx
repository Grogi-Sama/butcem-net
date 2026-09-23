import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { shadeColor } from '@/lib/color';
import { useTheme } from '@/hooks/useTheme';

export interface DonutSegment {
  key: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

const GAP_DEGREES = 3;

export function DonutChart({ data, size = 200, strokeWidth = 30, centerLabel, centerValue }: Props) {
  const theme = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<(DonutSegment & { arcLength: number; dashOffset: number })[]>(
    (acc, d) => {
      const cumulativeAngle = acc.reduce((sum, s) => sum + (total > 0 ? (s.value / total) * 360 : 0), 0);
      const angle = total > 0 ? (d.value / total) * 360 : 0;
      const gap = data.length > 1 ? GAP_DEGREES : 0;
      const arcAngle = Math.max(angle - gap, 0);
      const arcLength = (arcAngle / 360) * circumference;
      const dashOffset = -((cumulativeAngle / 360) * circumference);
      return [...acc, { ...d, arcLength, dashOffset }];
    },
    []
  );

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.shadowBase,
          {
            width: size - strokeWidth * 0.4,
            height: size - strokeWidth * 0.4,
            borderRadius: (size - strokeWidth * 0.4) / 2,
            top: strokeWidth * 0.2,
            left: strokeWidth * 0.2,
            backgroundColor: theme.background,
            shadowColor: '#000',
          },
        ]}
      />
      <Svg width={size} height={size}>
        <Defs>
          {segments.map((s) => (
            <LinearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={shadeColor(s.color, 18)} />
              <Stop offset="1" stopColor={shadeColor(s.color, -12)} />
            </LinearGradient>
          ))}
        </Defs>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={data.length === 0 ? 1 : 0.35}
          />
          {segments.map((s) => (
            <Circle
              key={s.key}
              cx={center}
              cy={center}
              r={radius}
              stroke={`url(#grad-${s.key})`}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.arcLength} ${circumference - s.arcLength}`}
              strokeDashoffset={s.dashOffset}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={styles.centerOverlay} pointerEvents="none">
          {centerValue && (
            <Text
              style={[styles.centerValue, { color: theme.text, maxWidth: size - strokeWidth * 2.4 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {centerValue}
            </Text>
          )}
          {centerLabel && <Text style={[styles.centerLabel, { color: theme.subtext }]}>{centerLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shadowBase: {
    position: 'absolute',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { fontSize: 19, fontWeight: '800' },
  centerLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
