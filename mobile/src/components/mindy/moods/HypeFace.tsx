import React from 'react';
import { Ellipse, Path, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

export function HypeFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="hypeGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="68" rx="35" ry="22" fill="url(#hypeGloss)" />
      <Path d="M66,98 Q 78,88 90,98" stroke="#0D1117" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M110,98 Q 122,88 134,98" stroke="#0D1117" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M76,125 Q 100,152 124,125 Q 100,145 76,125 Z" fill="#0D1117" />
      <Ellipse cx="100" cy="142" rx="8" ry="4" fill="#ff6b7a" opacity="0.8" />
      <SvgText x="170" y="55" fill="#FFD700" fontSize="18" fontWeight="700">✨</SvgText>
      <SvgText x="20" y="70" fill="#FFD700" fontSize="14" fontWeight="700">✨</SvgText>
    </>
  );
}
