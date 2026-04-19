import React from 'react';
import { Ellipse, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export function NeutralFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="neutralGloss" cx="0.35" cy="0.3" r="0.45">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#neutralGloss)" />
      <Ellipse cx="78" cy="100" rx="9" ry="11" fill="#0D1117" />
      <Ellipse cx="122" cy="100" rx="9" ry="11" fill="#0D1117" />
      <Circle cx="81" cy="96" r="3" fill="#fff" />
      <Circle cx="125" cy="96" r="3" fill="#fff" />
      <Path d="M68,84 Q 78,80 88,85" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M112,85 Q 122,80 132,84" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M85,128 Q 100,138 115,128" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </>
  );
}
