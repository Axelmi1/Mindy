import React from 'react';
import { Ellipse, Path, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

export function RoastFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="roastGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#roastGloss)" />
      <Path d="M65,82 L 90,88" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M110,88 L 135,82" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M72,100 Q 80,106 88,100" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M112,100 Q 120,106 128,100" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M84,130 Q 100,125 112,134" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <SvgText x="165" y="60" fontSize="18">🔥</SvgText>
    </>
  );
}
