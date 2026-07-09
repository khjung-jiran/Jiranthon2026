import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';
import { Icon } from '../icons';

export type ImageSlotShape = 'rounded' | 'circle' | 'pill' | 'rect';

export interface ImageSlotProps {
  /** 안내 문구 (원본 placeholder 문구 유지, 예: '가족 사진을 넣어보세요') */
  placeholder?: string;
  /** rounded일 때 반경 (기본 12) */
  radius?: number;
  shape?: ImageSlotShape;
  width?: number | string;
  height?: number | string;
  /** height가 없을 때 가로:세로 비율 (기본 1.5 = 3:2) */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 이미지 placeholder — 원본 <image-slot>의 RN 대체.
 * 회색 라운드 박스(bg rgba(0,0,0,.04)) + 점선 링(rgba(0,0,0,.25)) + image 아이콘 + 안내문구.
 * (드롭/업로드 기능 없이 시각적 placeholder만 재현)
 */
export function ImageSlot({
  placeholder = '이미지를 넣어보세요',
  radius = 12,
  shape = 'rounded',
  width = '100%',
  height,
  aspectRatio = 1.5,
  style,
}: ImageSlotProps) {
  const borderRadius = shape === 'circle' ? 9999 : shape === 'pill' ? 9999 : shape === 'rect' ? 0 : radius;
  return (
    <View
      style={[
        styles.box,
        { borderRadius, width: width as any },
        height != null ? { height: height as any } : { aspectRatio },
        style,
      ]}
    >
      <Icon name="image" size={28} color="rgba(0,0,0,0.45)" />
      <Text style={styles.caption}>{placeholder}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center',
  },
});
