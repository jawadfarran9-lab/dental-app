/**
 * Combo Sticker Designs for Story Editor – Flagship Collection
 *
 * 10 premium combo stickers that display BOTH clinic name and phone number
 * with layered gradients, glassmorphism, neon effects, and creative layouts.
 *
 * Props:
 *   clinicName        – dynamic clinic name (Firestore)
 *   clinicPhoneNumber – dynamic clinic phone (Firestore)
 *   size              – base size for scaling (default 160)
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface ComboStickerProps {
  clinicName: string;
  clinicPhoneNumber: string;
  size?: number;
}

// ── 1. Imperial Command Card ──
// Multi-layer gradient border on dark inner panel, tooth icon badge, gold divider, phone accent pill
export const ComboSticker1: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#1E40AF','#3B82F6','#60A5FA']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2.5,minWidth:150}}>
        <View style={{backgroundColor:'rgba(15,23,42,0.9)',borderRadius:14,paddingVertical:14,paddingHorizontal:20,alignItems:'center'}}>
          <View style={{width:28,height:28,borderRadius:9,backgroundColor:'rgba(56,189,248,0.12)',justifyContent:'center',alignItems:'center',marginBottom:5}}>
            <MaterialCommunityIcons name="tooth-outline" size={15} color="#38BDF8" />
          </View>
          <Text style={{color:'#F1F5F9',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <View style={{width:40,height:1.5,backgroundColor:'#38BDF8',borderRadius:1,marginVertical:6}} />
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:'rgba(56,189,248,0.08)',borderRadius:10,paddingHorizontal:10,paddingVertical:3}}>
            <Ionicons name="call" size={10} color="#7DD3FC" style={{marginRight:4}} />
            <Text style={{color:'#93C5FD',fontSize:10,fontWeight:'700',letterSpacing:0.4}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 2. Gold Dynasty Banner ──
// Multi-stop gold gradient border on dark inner field, serif type, star accents, phone with classic icon
export const ComboSticker2: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#92400E','#D4A017','#F5D060','#D4A017','#92400E']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:12,padding:2.5,minWidth:150}}>
        <View style={{backgroundColor:'#1C1917',borderRadius:10,paddingVertical:12,paddingHorizontal:18,alignItems:'center'}}>
          <Text style={{color:'#FDE68A',fontSize:7,letterSpacing:3,marginBottom:3}}>✦ ✦ ✦</Text>
          <Text style={{color:'#FEF3C7',fontSize:15,fontWeight:'900',letterSpacing:0.8,fontFamily:Platform.OS==='ios'?'Georgia':'serif',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <View style={{width:50,height:1,backgroundColor:'#D4A017',borderRadius:1,marginVertical:6}} />
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <MaterialCommunityIcons name="phone-classic" size={10} color="#FBBF24" style={{marginRight:4}} />
            <Text style={{color:'#FCD34D',fontSize:10,fontWeight:'700',letterSpacing:0.3}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 3. Aurora Medical Pill ──
// Purple-pink-orange gradient border, frosted inner pill, medical cross, phone in subtle pill
export const ComboSticker3: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#7C3AED','#EC4899','#F97316']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:28,padding:2,minWidth:150}}>
        <View style={{backgroundColor:'rgba(255,255,255,0.92)',borderRadius:26,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
          <View style={{width:24,height:24,borderRadius:7,backgroundColor:'rgba(124,58,237,0.1)',justifyContent:'center',alignItems:'center',marginBottom:4}}>
            <Ionicons name="add" size={14} color="#7C3AED" />
          </View>
          <Text style={{color:'#1E1B4B',fontSize:14,fontWeight:'900',letterSpacing:0.5,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <Text style={{color:'#6D28D9',fontSize:10,fontWeight:'700',marginTop:4,letterSpacing:0.3}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>📞 {clinicPhoneNumber}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 4. Neon Prism Glass ──
// Dark glass with neon purple glow border, sparkle-dot row, phone in neon accent pill
export const ComboSticker4: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <View style={{borderRadius:16,padding:2,backgroundColor:'#A855F7',minWidth:150,...Platform.select({ios:{shadowColor:'#A855F7',shadowOpacity:0.5,shadowRadius:14,shadowOffset:{width:0,height:0}},android:{elevation:8}})}}>
        <View style={{backgroundColor:'rgba(15,23,42,0.92)',borderRadius:14,paddingVertical:14,paddingHorizontal:18,alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
            {[0,1,2].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#C084FC',marginHorizontal:3}} />)}
          </View>
          <Text style={{color:'#F3E8FF',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center',textShadowColor:'#A855F7',textShadowRadius:8,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <View style={{flexDirection:'row',alignItems:'center',marginTop:6,backgroundColor:'rgba(168,85,247,0.12)',borderRadius:12,paddingHorizontal:10,paddingVertical:3}}>
            <Ionicons name="call" size={10} color="#C084FC" style={{marginRight:4}} />
            <Text style={{color:'#C084FC',fontSize:10,fontWeight:'700',letterSpacing:0.3}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── 5. Heritage Circle Seal ──
// Gradient-bordered circular badge, tooth center, name above, phone below
export const ComboSticker5: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#1E40AF','#3B82F6','#1E40AF']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:134,height:134,borderRadius:67,padding:3,justifyContent:'center',alignItems:'center'}}>
        <View style={{width:128,height:128,borderRadius:64,backgroundColor:'#FFF',justifyContent:'center',alignItems:'center',padding:10}}>
          <Text style={{color:'#1E40AF',fontSize:11,fontWeight:'900',letterSpacing:0.4,textAlign:'center',marginBottom:2}} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <MaterialCommunityIcons name="tooth-outline" size={20} color="#1E40AF" />
          <View style={{flexDirection:'row',alignItems:'center',marginTop:3}}>
            <Ionicons name="call-outline" size={8} color="#64748B" style={{marginRight:3}} />
            <Text style={{color:'#64748B',fontSize:8,fontWeight:'700'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 6. Amber Ticket Strip ──
// Horizontal ticket with amber gradient left bar, tooth + name row, gold divider, phone row
export const ComboSticker6: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <View style={{flexDirection:'row',backgroundColor:'#FFFBEB',borderRadius:12,overflow:'hidden',borderWidth:1.5,borderColor:'#F59E0B',minWidth:150}}>
        <LinearGradient colors={['#F59E0B','#D97706']} style={{width:7}} />
        <View style={{paddingVertical:10,paddingHorizontal:14,flex:1}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
            <View style={{width:22,height:22,borderRadius:6,backgroundColor:'rgba(245,158,11,0.12)',justifyContent:'center',alignItems:'center',marginRight:6}}>
              <MaterialCommunityIcons name="tooth-outline" size={12} color="#92400E" />
            </View>
            <Text style={{color:'#78350F',fontSize:13,fontWeight:'900',letterSpacing:0.4,flex:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          </View>
          <View style={{width:'100%',height:1,backgroundColor:'#FBBF24',opacity:0.5,marginBottom:4}} />
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <Ionicons name="call" size={10} color="#B45309" style={{marginRight:4}} />
            <Text style={{color:'#92400E',fontSize:10,fontWeight:'700'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── 7. Indigo Cascade Ribbon ──
// Multi-gradient indigo-purple ribbon, rainbow shimmer line, phone below
export const ComboSticker7: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#4338CA','#6366F1','#8B5CF6','#A855F7']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:10,padding:2,minWidth:150}}>
        <View style={{backgroundColor:'rgba(67,56,202,0.85)',borderRadius:8,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
          <Text style={{color:'#E0E7FF',fontSize:15,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <LinearGradient colors={['#818CF8','#C084FC','#F472B6','#FB923C']} start={{x:0,y:0}} end={{x:1,y:0}} style={{width:60,height:1.5,borderRadius:1,marginVertical:5}} />
          <Text style={{color:'rgba(224,231,255,0.8)',fontSize:10,fontWeight:'700',letterSpacing:0.5}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 8. Crystal White Panel ──
// Clean white with elegant shadow, tooth icon in subtle badge, phone indented below
export const ComboSticker8: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <View style={{backgroundColor:'#FFFFFF',borderRadius:14,paddingVertical:12,paddingHorizontal:18,minWidth:150,...Platform.select({ios:{shadowColor:'#000',shadowOpacity:0.1,shadowRadius:12,shadowOffset:{width:0,height:4}},android:{elevation:5}})}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
          <View style={{width:28,height:28,borderRadius:8,backgroundColor:'#EEF2FF',justifyContent:'center',alignItems:'center',marginRight:8}}>
            <MaterialCommunityIcons name="tooth-outline" size={14} color="#4F46E5" />
          </View>
          <Text style={{color:'#1E293B',fontSize:14,fontWeight:'900',letterSpacing:0.3,flex:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',marginLeft:36}}>
          <Ionicons name="call-outline" size={10} color="#94A3B8" style={{marginRight:4}} />
          <Text style={{color:'#64748B',fontSize:11,fontWeight:'600'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </View>
  );
};

// ── 9. Rose Bloom Card ──
// Pink gradient border, warm inner card, floral accents, phone in rose row
export const ComboSticker9: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#FDA4AF','#F43F5E','#FDA4AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:18,padding:2,minWidth:150}}>
        <View style={{backgroundColor:'#FFF1F2',borderRadius:16,paddingVertical:14,paddingHorizontal:20,alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
            <Text style={{fontSize:10}}>🌸</Text>
            <View style={{width:14,height:1,backgroundColor:'#FDA4AF',marginHorizontal:5}} />
            <Text style={{fontSize:10}}>🌸</Text>
          </View>
          <Text style={{color:'#9F1239',fontSize:14,fontWeight:'900',letterSpacing:0.5,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
          <View style={{flexDirection:'row',alignItems:'center',marginTop:5}}>
            <Ionicons name="call" size={10} color="#E11D48" style={{marginRight:4}} />
            <Text style={{color:'#BE185D',fontSize:10,fontWeight:'700'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 10. Emerald Command Center ──
// Dark horizontal badge with emerald gradient border, icon circle, text stack
export const ComboSticker10: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (
    <View style={[cs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#059669','#10B981','#34D399']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:14,padding:2,minWidth:150}}>
        <View style={{flexDirection:'row',backgroundColor:'rgba(15,23,42,0.9)',borderRadius:12,paddingVertical:10,paddingHorizontal:14,alignItems:'center'}}>
          <View style={{width:34,height:34,borderRadius:17,backgroundColor:'rgba(16,185,129,0.12)',justifyContent:'center',alignItems:'center',marginRight:10}}>
            <MaterialCommunityIcons name="tooth-outline" size={17} color="#6EE7B7" />
          </View>
          <View style={{flex:1}}>
            <Text style={{color:'#F0FDF4',fontSize:13,fontWeight:'900',letterSpacing:0.4}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
            <View style={{flexDirection:'row',alignItems:'center',marginTop:3}}>
              <Ionicons name="call" size={9} color="#6EE7B7" style={{marginRight:3}} />
              <Text style={{color:'#6EE7B7',fontSize:10,fontWeight:'700'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{clinicPhoneNumber}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── Export registry ────────────────────────────────────────────────────
export const COMBO_STICKER_DESIGNS = [
  { id: 'combo_1', label: 'Imperial Command', Component: ComboSticker1, clinicTypes: ['dental'] },
  { id: 'combo_2', label: 'Gold Dynasty', Component: ComboSticker2, clinicTypes: ['dental', 'laser', 'beauty'] },
  { id: 'combo_3', label: 'Aurora Medical', Component: ComboSticker3, clinicTypes: ['dental'] },
  { id: 'combo_4', label: 'Neon Prism', Component: ComboSticker4, clinicTypes: ['laser', 'beauty'] },
  { id: 'combo_5', label: 'Heritage Seal', Component: ComboSticker5, clinicTypes: ['dental'] },
  { id: 'combo_6', label: 'Amber Ticket', Component: ComboSticker6, clinicTypes: ['dental'] },
  { id: 'combo_7', label: 'Indigo Cascade', Component: ComboSticker7, clinicTypes: ['laser', 'beauty'] },
  { id: 'combo_8', label: 'Crystal White', Component: ComboSticker8, clinicTypes: ['dental'] },
  { id: 'combo_9', label: 'Rose Bloom', Component: ComboSticker9, clinicTypes: ['beauty'] },
  { id: 'combo_10', label: 'Emerald Command', Component: ComboSticker10, clinicTypes: ['dental'] },
] as const;

const cs = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
