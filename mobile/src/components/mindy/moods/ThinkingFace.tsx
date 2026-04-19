import React from 'react';
import { Ellipse, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export function ThinkingFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="thinkingGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#thinkingGloss)" />
      <Path d="M62,82 Q 78,76 90,82" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      <Path d="M112,78 Q 122,72 132,80" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      <Ellipse cx="78" cy="98" rx="9" ry="11" fill="#0D1117" />
      <Ellipse cx="122" cy="98" rx="9" ry="11" fill="#0D1117" />
      <Circle cx="81" cy="92" r="3" fill="#fff" />
      <Circle cx="125" cy="92" r="3" fill="#fff" />
      <Path d="M88,130 L 112,130" stroke="#0D1117" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="168" cy="55" r="6" fill="#58A6FF" opacity={0.8} />
      <Circle cx="180" cy="40" r="3.5" fill="#58A6FF" opacity={0.6} />
    </>
  );
}
