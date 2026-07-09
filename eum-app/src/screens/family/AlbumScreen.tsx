import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { ScreenContainer, Icon } from '../../components';
import { colors, fonts, radius, tint } from '../../theme';
import { useStore } from '../../store/useStore';
import * as api from '../../api';
import type { Photo } from '../../types';

/** 원본 photosData 톤 배경(반복 대각 스트라이프)의 근사 — RN 단순화: 톤 옅은 배경 + 카메라 아이콘 */
function PhotoTile({ photo, big }: { photo: Photo; big?: boolean }) {
  return (
    <View style={[s.tile, { backgroundColor: tint(photo.tone, 14), borderRadius: big ? radius.r18 : radius.r14 }]}>
      <Icon name="photo_camera" size={big ? 34 : 26} color={tint(photo.tone, 55)} />
      <View style={s.caption}>
        <Text style={s.captionText} numberOfLines={1}>
          {photo.label}
        </Text>
      </View>
    </View>
  );
}

/** 가족 앨범 (sAlbum, 516~565) — 부모/자녀 탭 공용 */
export function AlbumScreen() {
  const role = useStore((s) => s.role);
  return role === 'parent' ? <ParentAlbum /> : <ChildAlbum />;
}

// ── 자녀 모드 ────────────────────────────────────────────────────────
function ChildAlbum() {
  const albumFilter = useStore((s) => s.albumFilter);
  const setAlbumFilter = useStore((s) => s.setAlbumFilter);
  const extraPhotos = useStore((s) => s.extraPhotos);
  const addPhoto = useStore((s) => s.addPhoto);
  const showToast = useStore((s) => s.showToast);
  const [serverPhotos, setServerPhotos] = useState<Photo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPhotos = useCallback(async () => {
    const session = api.getSession();
    if (!session) return;
    setRefreshing(true);
    try {
      const photos = await api.listPhotos(session.familyId);
      setServerPhotos(photos.map((p) => ({
        label: p.label ?? '',
        who: p.who ?? '',
        tone: '#7C8A55',
      })));
    } catch (e) { console.warn('[eum] 사진 조회 실패:', e); }
    setRefreshing(false);
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const allPhotos = [...extraPhotos, ...serverPhotos];
  const filtered = allPhotos.filter((p) => albumFilter === '전체' || p.who === albumFilter);
  const albumFilters = ['전체', ...Array.from(new Set(serverPhotos.map((p) => p.who).filter(Boolean)))];

  const onUpload = () => {
    addPhoto();
    showToast('사진이 가족 앨범에 추가되었어요');
  };

  return (
    <ScreenContainer edges={['top']} style={s.root}>
      <View style={s.childHead}>
        <Text style={s.eyebrowBlue}>가족 앨범</Text>
        <Text style={s.h26}>모인 순간들</Text>
      </View>

      <ScrollView style={s.childBody} contentContainerStyle={s.childBodyContent} showsVerticalScrollIndicator={false}>
        <View style={s.faceBanner}>
          <View style={s.faceIcon}>
            <Icon name="face" size={24} color={colors.white} />
          </View>
          <Text style={s.faceText}>
            <Text style={s.bold}>얼굴 인식</Text>으로 엄마가 나온 사진 <Text style={s.bold}>4장</Text>이 자동으로
            모였어요
          </Text>
        </View>

        <View style={s.chipRow}>
          {albumFilters.map((label) => {
            const on = albumFilter === label;
            return (
              <Pressable
                key={label}
                onPress={() => setAlbumFilter(label)}
                style={[s.chip, { backgroundColor: on ? colors.blue : colors.surface, borderColor: on ? colors.blue : colors.border2 }]}
              >
                <Text style={[s.chipText, { color: on ? colors.white : colors.textMuted4 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.grid}>
          {filtered.map((p, i) => (
            <View key={i} style={s.gridItem}>
              <PhotoTile photo={p} />
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable style={s.fab} onPress={onUpload}>
        <Icon name="add_photo_alternate" size={30} color={colors.white} />
      </Pressable>
    </ScreenContainer>
  );
}

// ── 부모 모드 ────────────────────────────────────────────────────────
function ParentAlbum() {
  const extraPhotos = useStore((s) => s.extraPhotos);
  const [serverPhotos, setServerPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const load = async () => {
      const session = api.getSession();
      if (!session) return;
      try {
        const photos = await api.listPhotos(session.familyId);
        setServerPhotos(photos.map((p) => ({
          label: p.label ?? '',
          who: p.who ?? '',
          tone: '#7C8A55',
        })));
      } catch (e) { console.warn('[eum] 사진 조회 실패:', e); }
    };
    load();
  }, []);

  const allPhotos = [...extraPhotos, ...serverPhotos];
  const photosParent = allPhotos.slice(0, 6);

  return (
    <ScreenContainer edges={['top']} scroll contentContainerStyle={s.parentBody}>
      <View style={s.parentHead}>
        <Text style={s.eyebrowAccent}>부모님 모드</Text>
        <Text style={s.h28}>가족 사진</Text>
        <Text style={s.parentIntro}>
          자녀들이 올린 사진이에요.{'\n'}눌러서 크게 볼 수 있어요.
        </Text>
      </View>
      <View style={s.gridParent}>
        {photosParent.map((p, i) => (
          <View key={i} style={s.gridParentItem}>
            <PhotoTile photo={p} big />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  root: { position: 'relative' },
  // 자녀
  childHead: { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12 },
  eyebrowBlue: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.blue, letterSpacing: 0.4 },
  h26: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, marginTop: 5, letterSpacing: -0.5 },
  childBody: { flex: 1 },
  childBodyContent: { paddingHorizontal: 22, paddingBottom: 90 },

  faceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral,
    borderRadius: radius.r16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  faceIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  faceText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.text2 },
  bold: { fontFamily: fonts.bold },

  chipRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 14, flexWrap: 'wrap' },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.bold, fontSize: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '31.5%', aspectRatio: 1 },
  tile: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  caption: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: colors.textScrim,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  captionText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 8,
  },

  // 부모
  parentBody: { paddingBottom: 8 },
  parentHead: { paddingTop: 22, paddingHorizontal: 26, paddingBottom: 14 },
  eyebrowAccent: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.accent, letterSpacing: 0.4 },
  h28: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginTop: 6, letterSpacing: -0.5 },
  parentIntro: { fontFamily: fonts.regular, fontSize: 17, color: colors.textMuted2, marginTop: 8, lineHeight: 26 },

  gridParent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 26,
  },
  gridParentItem: { width: '47.5%', aspectRatio: 1 },
});

export default AlbumScreen;
