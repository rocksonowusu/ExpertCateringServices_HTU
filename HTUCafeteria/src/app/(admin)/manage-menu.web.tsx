// Web-only admin Menu page — food-card grid.
// Drag a card (from its photo/grip) onto a drop zone:
//   ⭐ Today's Special → feature it (shows as removable chips)
//   🚫 Sold Out        → hide it from the app
// Uses pointer events (reliable in react-native-web) rather than HTML5 DnD.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { type MenuItem } from '@/constants/data';
import { useMenuStore } from '@/store/menuStore';

const CATEGORIES = ['All', 'Rice Dishes', 'Soups & Stews', 'Fast Food', 'Snacks', 'Drinks', 'Breakfast'];
const CATS = CATEGORIES.filter((c) => c !== 'All');

// ─────────────────────────────────────────────────────────────
// Add Menu Item — large animated modal
// ─────────────────────────────────────────────────────────────
function ItemModal({
  visible, editItem, initialCategory, onClose, onSubmit, uploadImage,
}: {
  visible: boolean;
  editItem: MenuItem | null;
  initialCategory: string;
  onClose: () => void;
  onSubmit: (item: MenuItem) => void;
  uploadImage: (file: File) => Promise<string | null>;
}) {
  const { width, height } = useWindowDimensions();
  const twoCol = width >= 860;

  const backdrop = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATS[0]);
  const [price, setPrice] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [calories, setCalories] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showError, setShowError] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editItem) {
        setName(editItem.name);
        setCategory(editItem.category);
        setPrice(String(editItem.price));
        setPrepTime(editItem.prepTime ?? '');
        setCalories(editItem.calories != null ? String(editItem.calories) : '');
        setImage(editItem.image ?? '');
        setDescription(editItem.description ?? '');
        setTags((editItem.tags ?? []).join(', '));
        setIsAvailable(editItem.isAvailable);
        setIsPopular(editItem.isPopular);
        setIsFeatured(editItem.isFeatured);
      } else {
        setName(''); setCategory(CATS.includes(initialCategory) ? initialCategory : CATS[0]);
        setPrice(''); setPrepTime(''); setCalories(''); setImage('');
        setDescription(''); setTags('');
        setIsAvailable(true); setIsPopular(false); setIsFeatured(false);
      }
      setShowError(false); setPendingFile(null); setUploading(false);
      backdrop.setValue(0); card.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(card, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start();
    }
  }, [visible, editItem, initialCategory, backdrop, card]);

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 170, useNativeDriver: true }),
      Animated.timing(card, { toValue: 0, duration: 170, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  };

  // Web file picker → reads the chosen image as a data URL.
  const pickImage = () => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        window.alert('Please choose an image under 5MB.');
        return;
      }
      setPendingFile(file);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const priceNum = parseFloat(price);
  const valid = name.trim() && !isNaN(priceNum) && priceNum >= 0;

  const submit = async () => {
    if (!valid) { setShowError(true); return; }
    let finalImage = image;
    if (pendingFile) {
      setUploading(true);
      const url = await uploadImage(pendingFile);
      setUploading(false);
      if (url) finalImage = url;
    }
    const item: MenuItem = {
      id: editItem?.id ?? `m_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Freshly prepared.',
      price: priceNum,
      category,
      image: finalImage.trim() || 'https://loremflickr.com/400/300/food',
      rating: editItem?.rating ?? 0,
      reviewCount: editItem?.reviewCount ?? 0,
      prepTime: prepTime.trim() || '10 min',
      isAvailable,
      isPopular,
      isFeatured,
      calories: calories.trim() ? parseInt(calories, 10) : undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    onSubmit(item);
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[md.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View
          style={[
            md.card,
            { maxHeight: height * 0.92 },
            {
              opacity: card,
              transform: [
                { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={md.header}>
            <View style={md.headIcon}>
              <Ionicons name={editItem ? 'create' : 'fast-food'} size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={md.title}>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
              <Text style={md.subtitle}>
                {editItem ? 'Update this dish on the HTU Cafeteria menu' : 'Create a new dish for the HTU Cafeteria menu'}
              </Text>
            </View>
            <TouchableOpacity style={md.closeBtn} onPress={close} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={md.body}>
            <View style={[twoCol ? md.row : md.col, { gap: 24 }]}>
              {/* Left: image + flags */}
              <View style={[md.leftCol, twoCol && { width: 300 }]}>
                <TouchableOpacity style={md.preview} onPress={pickImage} activeOpacity={0.85}>
                  {image.trim() ? (
                    <>
                      <Image source={{ uri: image }} style={md.previewImg} contentFit="cover" transition={200} />
                      <View style={md.previewChange}>
                        <Ionicons name="camera-outline" size={14} color={Colors.white} />
                        <Text style={md.previewChangeTxt}>Change</Text>
                      </View>
                    </>
                  ) : (
                    <View style={md.previewEmpty}>
                      <View style={md.uploadCircle}>
                        <Ionicons name="cloud-upload-outline" size={26} color={Colors.primary} />
                      </View>
                      <Text style={md.previewEmptyTxt}>Click to upload an image</Text>
                      <Text style={md.previewEmptySub}>PNG or JPG · up to 5MB</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={md.uploadRow}>
                  <TouchableOpacity style={md.uploadBtn} onPress={pickImage} activeOpacity={0.85}>
                    <Ionicons name="cloud-upload-outline" size={16} color={Colors.primary} />
                    <Text style={md.uploadBtnTxt}>{image.trim() ? 'Replace Image' : 'Upload Image'}</Text>
                  </TouchableOpacity>
                  {image.trim() ? (
                    <TouchableOpacity style={md.clearImgBtn} onPress={() => { setImage(''); setPendingFile(null); }} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Field label="Or paste an image URL">
                  <TextInput
                    value={image.startsWith('data:') ? '' : image}
                    onChangeText={setImage}
                    placeholder="https://…"
                    placeholderTextColor={Colors.textMuted}
                    style={[md.input, { outlineWidth: 0 } as any]}
                    autoCapitalize="none"
                    editable={!image.startsWith('data:')}
                  />
                </Field>

                <View style={md.flags}>
                  <FlagRow icon="checkmark-circle-outline" label="Available" desc="Show on the app" value={isAvailable} onChange={setIsAvailable} />
                  <FlagRow icon="flame-outline" label="Popular" desc="Mark as popular" value={isPopular} onChange={setIsPopular} />
                  <FlagRow icon="star-outline" label="Today's Special" desc="Feature on home" value={isFeatured} onChange={setIsFeatured} />
                </View>
              </View>

              {/* Right: details */}
              <View style={{ flex: 1, gap: 16, minWidth: 0 }}>
                <Field label="Dish Name *" error={showError && !name.trim() ? 'Name is required' : undefined}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Jollof Rice + Chicken"
                    placeholderTextColor={Colors.textMuted}
                    style={[md.input, { outlineWidth: 0 } as any]}
                  />
                </Field>

                <Field label="Category">
                  <View style={md.catChips}>
                    {CATS.map((c) => {
                      const active = category === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setCategory(c)}
                          style={[md.catChip, active && md.catChipActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={[md.catChipTxt, active && md.catChipTxtActive]}>{c}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Field>

                <View style={md.row}>
                  <Field label="Price (₵) *" style={{ flex: 1 }} error={showError && (isNaN(priceNum) || priceNum < 0) ? 'Enter a price' : undefined}>
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      style={[md.input, { outlineWidth: 0 } as any]}
                    />
                  </Field>
                  <Field label="Prep Time" style={{ flex: 1 }}>
                    <TextInput
                      value={prepTime}
                      onChangeText={setPrepTime}
                      placeholder="e.g. 15–20 min"
                      placeholderTextColor={Colors.textMuted}
                      style={[md.input, { outlineWidth: 0 } as any]}
                    />
                  </Field>
                  <Field label="Calories" style={{ flex: 1 }}>
                    <TextInput
                      value={calories}
                      onChangeText={setCalories}
                      placeholder="e.g. 680"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      style={[md.input, { outlineWidth: 0 } as any]}
                    />
                  </Field>
                </View>

                <Field label="Description">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the dish…"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    style={[md.input, md.textarea, { outlineWidth: 0 } as any]}
                  />
                </Field>

                <Field label="Tags (comma separated)">
                  <TextInput
                    value={tags}
                    onChangeText={setTags}
                    placeholder="Popular, Staff Pick, Vegan"
                    placeholderTextColor={Colors.textMuted}
                    style={[md.input, { outlineWidth: 0 } as any]}
                  />
                </Field>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={md.footer}>
            {showError && !valid && (
              <Text style={md.footerError}>Please fill in the required fields (*)</Text>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={md.cancelBtn} onPress={close} activeOpacity={0.85}>
              <Text style={md.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[md.saveBtn, (!valid || uploading) && md.saveBtnOff]} onPress={submit} disabled={uploading} activeOpacity={0.88}>
              <Ionicons name={uploading ? 'cloud-upload-outline' : editItem ? 'checkmark' : 'add'} size={18} color={Colors.white} />
              <Text style={md.saveTxt}>{uploading ? 'Uploading…' : editItem ? 'Save Changes' : 'Add to Menu'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function Field({ label, error, style, children }: { label: string; error?: string; style?: any; children: React.ReactNode }) {
  return (
    <View style={[md.field, style]}>
      <Text style={md.label}>{label}</Text>
      {children}
      {error ? <Text style={md.fieldError}>{error}</Text> : null}
    </View>
  );
}

function FlagRow({
  icon, label, desc, value, onChange,
}: { icon: any; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={md.flagRow}>
      <View style={md.flagIcon}><Ionicons name={icon} size={16} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={md.flagLabel}>{label}</Text>
        <Text style={md.flagDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '70' }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

const md = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(28,2,12,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 940,
    backgroundColor: Colors.white,
    borderRadius: 26, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.4)', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 1, shadowRadius: 50,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 26, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 21, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: 26 },
  row: { flexDirection: 'row', gap: 14 },
  col: { flexDirection: 'column' },
  leftCol: { gap: 16 },

  preview: {
    width: '100%', height: 200, borderRadius: 16, overflow: 'hidden',
    backgroundColor: Colors.backgroundAlt, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed',
    ...({ cursor: 'pointer' } as any),
  },
  previewImg: { width: '100%', height: '100%' },
  previewChange: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6,
  },
  previewChangeTxt: { fontSize: 11.5, fontWeight: '700', color: Colors.white },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  uploadCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  previewEmptyTxt: { fontSize: 13.5, color: Colors.text, fontWeight: '700' },
  previewEmptySub: { fontSize: 11.5, color: Colors.textMuted },

  uploadRow: { flexDirection: 'row', gap: 8 },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  uploadBtnTxt: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  clearImgBtn: {
    width: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.error + '40', backgroundColor: Colors.error + '0C',
  },

  field: { gap: 7 },
  label: { fontSize: 12.5, fontWeight: '700', color: Colors.text },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text,
  },
  textarea: { height: 96, textAlignVertical: 'top' },
  fieldError: { fontSize: 11.5, color: Colors.error, fontWeight: '600' },

  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.backgroundAlt, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipTxt: { fontSize: 12.5, fontWeight: '700', color: Colors.textSecondary },
  catChipTxtActive: { color: Colors.white },

  flags: { gap: 10 },
  flagRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: Colors.backgroundAlt, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  flagIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  flagLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  flagDesc: { fontSize: 11, color: Colors.textMuted },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 26, paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerError: { fontSize: 12.5, color: Colors.error, fontWeight: '600' },
  cancelBtn: {
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 24,
  },
  saveBtnOff: { opacity: 0.5 },
  saveTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },
});

type Rect = { x: number; y: number; w: number; h: number };
type Zone = 'featured' | 'soldout';
type Ghost = { id: string; name: string; image: string };

export default function ManageMenuWeb() {
  const { items, loadMenu, addItem, updateItem, removeItem, uploadImage } = useMenuStore();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const { width } = useWindowDimensions();

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (item: MenuItem) => { setEditItem(item); setShowModal(true); };
  const upsertItem = (item: MenuItem) => {
    if (items.some((i) => i.id === item.id)) updateItem(item);
    else addItem(item);
  };
  const handleDelete = (item: MenuItem) => {
    if (typeof window !== 'undefined' && window.confirm(`Delete "${item.name}" from the menu? This can't be undone.`)) {
      removeItem(item.id);
    }
  };

  const cols = width >= 1500 ? 4 : width >= 1100 ? 3 : width >= 760 ? 2 : 1;
  const cardBasis = `${100 / cols}%`;

  // ── Drag state ──
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [overZone, setOverZone] = useState<Zone | null>(null);

  const featuredRef = useRef<View>(null);
  const soldoutRef = useRef<View>(null);
  const rects = useRef<{ featured?: Rect; soldout?: Rect }>({});

  const measureZones = () => {
    featuredRef.current?.measureInWindow((x, y, w, h) => { rects.current.featured = { x, y, w, h }; });
    soldoutRef.current?.measureInWindow((x, y, w, h) => { rects.current.soldout = { x, y, w, h }; });
  };

  const hitZone = (x: number, y: number): Zone | null => {
    const inside = (r?: Rect) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inside(rects.current.featured)) return 'featured';
    if (inside(rects.current.soldout)) return 'soldout';
    return null;
  };

  const setAvailable = (id: string, v: boolean) => {
    const it = items.find((i) => i.id === id);
    if (it) updateItem({ ...it, isAvailable: v });
  };
  const setFeatured = (id: string, v: boolean) => {
    const it = items.find((i) => i.id === id);
    if (it) updateItem({ ...it, isFeatured: v });
  };
  const toggle = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (it) updateItem({ ...it, isAvailable: !it.isAvailable });
  };

  // Begin a drag from a card's photo/grip.
  const startDrag = (item: MenuItem, e: any) => {
    const startX = e?.nativeEvent?.clientX ?? e?.clientX ?? 0;
    const startY = e?.nativeEvent?.clientY ?? e?.clientY ?? 0;
    measureZones();
    let started = false;

    const move = (ev: PointerEvent) => {
      if (!started) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
        started = true;
        setGhost({ id: item.id, name: item.name, image: item.image });
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });
      setOverZone(hitZone(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (started) {
        const zone = hitZone(ev.clientX, ev.clientY);
        if (zone === 'featured') setFeatured(item.id, true);
        else if (zone === 'soldout') setAvailable(item.id, false);
      }
      setGhost(null);
      setOverZone(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) => (cat === 'All' || i.category === cat) && (!q || i.name.toLowerCase().includes(q))
    );
  }, [items, search, cat]);

  const featured = items.filter((i) => i.isFeatured);
  const soldOut = items.filter((i) => !i.isAvailable);
  const availableCount = items.filter((i) => i.isAvailable).length;

  return (
    <View style={s.page}>
      {/* ── Fixed header: top bar + drop zones + filters (do not scroll) ── */}
      <View style={s.header}>
        <View style={s.headerInner}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Menu Management</Text>
            <Text style={s.subtitle}>
              {items.length} items · {availableCount} available · drag a card onto a zone below
            </Text>
          </View>
          <View style={s.search}>
            <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search meals…"
              placeholderTextColor={Colors.textMuted}
              style={[s.searchInput, { outlineWidth: 0 } as any]}
            />
          </View>
          <View style={s.viewToggle}>
            <TouchableOpacity onPress={() => setView('grid')} style={[s.viewBtn, view === 'grid' && s.viewBtnActive]} activeOpacity={0.8}>
              <Ionicons name="grid" size={15} color={view === 'grid' ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setView('table')} style={[s.viewBtn, view === 'table' && s.viewBtnActive]} activeOpacity={0.8}>
              <Ionicons name="list" size={18} color={view === 'table' ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.88} onPress={openAdd}>
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={s.addTxt}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Drop zones */}
        <View style={s.zones}>
          <View
            ref={featuredRef}
            style={[s.zone, s.zoneFeatured, overZone === 'featured' && s.zoneActiveFeatured]}
          >
            <View style={s.zoneHead}>
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={s.zoneTitle}>Today's Special</Text>
              <Text style={s.zoneHint}>drop a dish to feature it</Text>
            </View>
            <View style={s.chips}>
              {featured.length === 0 ? (
                <Text style={s.zoneEmpty}>No featured dishes yet</Text>
              ) : (
                featured.map((f) => (
                  <View key={f.id} style={s.chip}>
                    <Image source={{ uri: f.image }} style={s.chipImg} contentFit="cover" />
                    <Text style={s.chipTxt} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => setFeatured(f.id, false)} activeOpacity={0.7}>
                      <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          <View
            ref={soldoutRef}
            style={[s.zone, s.zoneSold, overZone === 'soldout' && s.zoneActiveSold]}
          >
            <View style={s.zoneHead}>
              <Ionicons name="ban" size={16} color={Colors.error} />
              <Text style={s.zoneTitle}>Sold Out</Text>
              <Text style={s.zoneHint}>drop a dish to hide it</Text>
            </View>
            <View style={s.chips}>
              {soldOut.length === 0 ? (
                <Text style={s.zoneEmpty}>No hidden dishes — everything's on the menu</Text>
              ) : (
                soldOut.map((f) => (
                  <View key={f.id} style={s.chip}>
                    <Image source={{ uri: f.image }} style={s.chipImg} contentFit="cover" {...({ draggable: false } as any)} />
                    <Text style={s.chipTxt} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => setAvailable(f.id, true)} activeOpacity={0.7}>
                      <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Category tabs */}
        <View style={s.tabs}>
          {CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <TouchableOpacity key={c} onPress={() => setCat(c)} activeOpacity={0.8} style={s.tabWrap}>
                <Text style={[s.tab, active && s.tabActive]}>{c}</Text>
                {active && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
        </View>
      </View>

      {/* ── Scrollable region: only the menu items ── */}
      <ScrollView style={s.listScroll} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {view === 'table' ? (
          <View style={s.constrain}>
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={[s.th, { flex: 2 }]}>Item</Text>
                <Text style={[s.th, { width: 130 }]}>Category</Text>
                <Text style={[s.th, { width: 70 }]}>Rating</Text>
                <Text style={[s.th, { width: 80, textAlign: 'right' }]}>Price</Text>
                <Text style={[s.th, { width: 110 }]}>Status</Text>
                <Text style={[s.th, { width: 188, textAlign: 'right' }]}>Actions</Text>
              </View>

              {filtered.map((item) => (
                <View key={item.id} style={[s.tr, !item.isAvailable && s.trOff]}>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <View
                      style={s.thumbWrap}
                      {...({ onPointerDown: (e: any) => startDrag(item, e), draggable: false } as any)}
                    >
                      <Image source={{ uri: item.image }} style={s.thumb} contentFit="cover" {...({ draggable: false } as any)} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.trName} numberOfLines={1}>{item.name}</Text>
                      {item.isFeatured && <Text style={s.trSpecial}>★ Today's Special</Text>}
                    </View>
                  </View>
                  <Text style={[s.trCat, { width: 130 }]} numberOfLines={1}>{item.category}</Text>
                  <View style={{ width: 70, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={12} color={Colors.accent} />
                    <Text style={s.trMeta}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={[s.trPrice, { width: 80, textAlign: 'right' }]}>₵{item.price}</Text>
                  <View style={{ width: 110 }}>
                    <View style={[s.trStatus, { backgroundColor: item.isAvailable ? '#E8F5E9' : '#F0F0F0' }]}>
                      <Text style={[s.trStatusTxt, { color: item.isAvailable ? Colors.success : Colors.textMuted }]}>
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 188, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: Colors.border, true: Colors.success + '70' }}
                      thumbColor={item.isAvailable ? Colors.success : Colors.textMuted}
                    />
                    <TouchableOpacity onPress={() => openEdit(item)} style={s.trEdit} activeOpacity={0.8}>
                      <Ionicons name="pencil" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={s.trDel} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="restaurant-outline" size={40} color={Colors.textMuted} />
                  <Text style={s.emptyTxt}>No items match your search</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
        <View style={[s.constrain, s.grid]}>
          {filtered.map((item) => (
            <View key={item.id} style={[s.cardCell, { flexBasis: cardBasis as any, maxWidth: cardBasis as any }]}>
              <View style={[s.card, !item.isAvailable && s.cardOff]}>
                <View
                  style={s.imgWrap}
                  {...({ onPointerDown: (e: any) => startDrag(item, e), draggable: false } as any)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={s.img}
                    contentFit="cover"
                    transition={200}
                    {...({ draggable: false } as any)}
                  />
                  {item.isFeatured && (
                    <View style={s.featBadge}>
                      <Ionicons name="star" size={10} color={Colors.white} />
                      <Text style={s.featTxt}>Special</Text>
                    </View>
                  )}
                  {!item.isAvailable && (
                    <View style={s.offOverlay}><Text style={s.offOverlayTxt}>Off Menu</Text></View>
                  )}
                  <View style={s.grip}>
                    <Ionicons name="move-outline" size={15} color={Colors.white} />
                  </View>
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item)} activeOpacity={0.85}>
                    <Ionicons name="trash-outline" size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={s.body}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => openEdit(item)} style={s.editArea}>
                    <View style={s.nameRow}>
                      <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                      <Ionicons name="create-outline" size={15} color={Colors.textMuted} />
                    </View>
                    <Text style={s.category}>{item.category}</Text>
                    <View style={s.metaRow}>
                      <View style={s.rating}>
                        <Ionicons name="star" size={12} color={Colors.accent} />
                        <Text style={s.ratingTxt}>{item.rating.toFixed(1)}</Text>
                      </View>
                      <Text style={s.dot}>·</Text>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={s.prep}>{item.prepTime}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={s.footerRow}>
                    <Text style={s.price}>₵{item.price}</Text>
                    <View style={s.availRow}>
                      <Text style={[s.availTxt, { color: item.isAvailable ? Colors.success : Colors.textMuted }]}>
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </Text>
                      <Switch
                        value={item.isAvailable}
                        onValueChange={() => toggle(item.id)}
                        trackColor={{ false: Colors.border, true: Colors.success + '70' }}
                        thumbColor={item.isAvailable ? Colors.success : Colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="restaurant-outline" size={40} color={Colors.textMuted} />
              <Text style={s.emptyTxt}>No items match your search</Text>
            </View>
          )}
        </View>
        )}
      </ScrollView>

      {/* Drag ghost — follows the cursor */}
      {ghost && (
        <View
          pointerEvents="none"
          style={[s.ghost, { left: ghostPos.x + 14, top: ghostPos.y + 14 } as any]}
        >
          <Image source={{ uri: ghost.image }} style={s.ghostImg} contentFit="cover" {...({ draggable: false } as any)} />
          <Text style={s.ghostTxt} numberOfLines={1}>{ghost.name}</Text>
        </View>
      )}

      {/* Add / Edit Menu Item modal */}
      <ItemModal
        visible={showModal}
        editItem={editItem}
        initialCategory={cat}
        onClose={() => setShowModal(false)}
        onSubmit={upsertItem}
        uploadImage={uploadImage}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.backgroundAlt },

  // Fixed header (top bar + zones + filters)
  header: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 28, paddingTop: 28, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    zIndex: 5,
  },
  headerInner: { width: '100%', gap: 18 },

  // Scrollable list
  listScroll: { flex: 1 },
  listContent: { paddingHorizontal: 28, paddingVertical: 20 },
  constrain: { width: '100%' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.white, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border, minWidth: 240,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24,
  },
  addTxt: { fontSize: 13.5, fontWeight: '800', color: Colors.white },

  // View toggle (grid / table)
  viewToggle: {
    flexDirection: 'row', gap: 4, padding: 4,
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  viewBtn: { width: 38, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { backgroundColor: Colors.primary },

  // Table view
  table: { backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: Colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  th: { fontSize: 11.5, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  trOff: { opacity: 0.6 },
  thumbWrap: { width: 46, height: 46, borderRadius: 11, overflow: 'hidden', ...({ cursor: 'grab' } as any) },
  thumb: { width: '100%', height: '100%' },
  trName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  trSpecial: { fontSize: 10.5, fontWeight: '700', color: Colors.accentDark, marginTop: 1 },
  trCat: { fontSize: 12.5, color: Colors.textSecondary },
  trMeta: { fontSize: 12.5, fontWeight: '700', color: Colors.text },
  trPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  trStatus: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  trStatusTxt: { fontSize: 11.5, fontWeight: '800' },
  trEdit: {
    width: 32, height: 32, borderRadius: 9,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  trDel: {
    width: 32, height: 32, borderRadius: 9,
    borderWidth: 1, borderColor: Colors.error + '40', backgroundColor: Colors.error + '0C',
    alignItems: 'center', justifyContent: 'center',
  },

  // Drop zones
  zones: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  zone: {
    flex: 1, minWidth: 280,
    borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 2, borderStyle: 'dashed',
  },
  zoneFeatured: { backgroundColor: '#FFF9EF', borderColor: Colors.accent + '55' },
  zoneActiveFeatured: { borderColor: Colors.accent, backgroundColor: '#FFF0D4' },
  zoneSold: { backgroundColor: '#FDF1F1', borderColor: Colors.error + '44' },
  zoneActiveSold: { borderColor: Colors.error, backgroundColor: '#FADDDD' },
  zoneHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zoneTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.text },
  zoneHint: { fontSize: 11.5, color: Colors.textMuted, marginLeft: 'auto' },
  zoneEmpty: { fontSize: 12.5, color: Colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.white, borderRadius: 20,
    paddingLeft: 4, paddingRight: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipImg: { width: 26, height: 26, borderRadius: 13 },
  chipTxt: { fontSize: 12, fontWeight: '700', color: Colors.text, maxWidth: 130 },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 2 },
  tabWrap: { paddingVertical: 8 },
  tab: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabActive: { color: Colors.primary, fontWeight: '800' },
  tabUnderline: { height: 3, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  cardCell: { padding: 8 },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
  },
  cardOff: { opacity: 0.72 },
  imgWrap: { width: '100%', height: 150, position: 'relative', ...({ cursor: 'grab' } as any) },
  img: { width: '100%', height: '100%' },
  featBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3,
  },
  featTxt: { fontSize: 10, fontWeight: '800', color: Colors.white },
  offOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,26,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  offOverlayTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },
  grip: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  delBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(198,40,40,0.92)',
    alignItems: 'center', justifyContent: 'center',
    ...({ cursor: 'pointer' } as any),
  },
  body: { padding: 14, gap: 5 },
  editArea: { gap: 5, ...({ cursor: 'pointer' } as any) },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.text },
  category: { fontSize: 11.5, fontWeight: '600', color: Colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 12, fontWeight: '700', color: Colors.text },
  dot: { fontSize: 12, color: Colors.textMuted },
  prep: { fontSize: 12, color: Colors.textMuted },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availTxt: { fontSize: 11.5, fontWeight: '700' },

  empty: { width: '100%', alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },

  // Drag ghost
  ghost: {
    ...({ position: 'fixed' } as any),
    zIndex: 9999,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.white,
    borderRadius: 14, paddingLeft: 6, paddingRight: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20,
  },
  ghostImg: { width: 40, height: 40, borderRadius: 10 },
  ghostTxt: { fontSize: 13, fontWeight: '800', color: Colors.text, maxWidth: 180 },
});
