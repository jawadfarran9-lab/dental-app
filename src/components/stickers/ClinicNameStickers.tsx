/**
 * Clinic Name Sticker Designs for Story Editor — Flagship Collection
 *
 * 10 premium, visually striking clinic name sticker designs.
 * Each is a pure React Native component with layered styling,
 * creative layouts, and modern UI aesthetics for brand identity.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface ClinicNameStickerProps {
  clinicName: string;
  size?: number;
}

// ── 1. Imperial Gold Seal ──
// Multi-layer gold gradient border with dark inner field and ornate accents
export const ClinicNameSticker1: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#B45309','#D97706','#FBBF24','#D97706','#B45309']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:2.5}}>
        <View style={{backgroundColor:'#1C1917',borderRadius:12,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
            <View style={{width:14,height:1,backgroundColor:'#D97706'}} />
            <Text style={{color:'#FDE68A',fontSize:7,letterSpacing:3,marginHorizontal:6}}>✦ ✦ ✦</Text>
            <View style={{width:14,height:1,backgroundColor:'#D97706'}} />
          </View>
          <Text style={{color:'#FEF3C7',fontSize:16,fontWeight:'900',letterSpacing:1,fontFamily:Platform.OS==='ios'?'Georgia':'serif',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 2. Midnight Pulse Card ──
// Dark card with glowing cyan accent bars top+bottom and icon badge
export const ClinicNameSticker2: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <View style={{backgroundColor:'#0F172A',borderRadius:14,overflow:'hidden',borderWidth:1.5,borderColor:'#06B6D4'}}>
        <View style={{height:3,backgroundColor:'#06B6D4'}} />
        <View style={{paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
          <View style={{width:28,height:28,borderRadius:8,backgroundColor:'rgba(6,182,212,0.12)',justifyContent:'center',alignItems:'center',marginRight:10}}>
            <MaterialCommunityIcons name="tooth-outline" size={15} color="#22D3EE" />
          </View>
          <Text style={{color:'#F1F5F9',fontSize:16,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <View style={{height:3,backgroundColor:'#06B6D4'}} />
      </View>
    </View>
  );
};

// ── 3. Aurora Gradient Pill ──
// Vibrant purple-pink gradient border with frosted inner pill
export const ClinicNameSticker3: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#8B5CF6','#EC4899','#F97316']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:26,padding:2.5}}>
        <View style={{backgroundColor:'rgba(15,23,42,0.85)',borderRadius:24,paddingVertical:10,paddingHorizontal:20,flexDirection:'row',alignItems:'center'}}>
          <View style={{width:26,height:26,borderRadius:13,backgroundColor:'rgba(139,92,246,0.2)',justifyContent:'center',alignItems:'center',marginRight:8}}>
            <MaterialCommunityIcons name="tooth" size={14} color="#C4B5FD" />
          </View>
          <Text style={{color:'#F1F5F9',fontSize:15,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 4. Matrix Neon ──
// Triple-layer neon green glow ring with dark field and monospace vibe
export const ClinicNameSticker4: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <View style={{borderRadius:18,padding:2,backgroundColor:'#22C55E',...Platform.select({ios:{shadowColor:'#22C55E',shadowOpacity:0.5,shadowRadius:16,shadowOffset:{width:0,height:0}},android:{elevation:8}})}}>
        <View style={{backgroundColor:'#030712',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
            <View style={{width:8,height:8,borderRadius:4,backgroundColor:'#22C55E',marginRight:6}} />
            <Text style={{color:'#4ADE80',fontSize:8,fontWeight:'700',letterSpacing:2}}>CLINIC</Text>
          </View>
          <Text style={{color:'#22C55E',fontSize:16,fontWeight:'900',letterSpacing:1.2,textShadowColor:'#22C55E',textShadowRadius:10,textShadowOffset:{width:0,height:0},textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </View>
    </View>
  );
};

// ── 5. Heritage Crest Banner ──
// Warm ivory card with gold dividers, medical icon, and serif font
export const ClinicNameSticker5: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <View style={{backgroundColor:'#FFFDF7',borderRadius:10,paddingVertical:14,paddingHorizontal:24,alignItems:'center',borderWidth:1.5,borderColor:'#D4A017',...Platform.select({ios:{shadowColor:'#D4A017',shadowOpacity:0.15,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:4}})}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:6}}>
          <View style={{width:20,height:1.5,backgroundColor:'#D4A017',borderRadius:1}} />
          <Ionicons name="medical" size={12} color="#D4A017" style={{marginHorizontal:8}} />
          <View style={{width:20,height:1.5,backgroundColor:'#D4A017',borderRadius:1}} />
        </View>
        <Text style={{color:'#1A1A1A',fontSize:16,fontWeight:'900',letterSpacing:0.8,fontFamily:Platform.OS==='ios'?'Georgia':'serif',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </View>
  );
};

// ── 6. Indigo Ring Badge ──
// Circular gradient border badge with tooth icon and bold name
export const ClinicNameSticker6: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#6366F1','#818CF8','#6366F1']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:106,height:106,borderRadius:53,padding:3,justifyContent:'center',alignItems:'center'}}>
        <View style={{width:100,height:100,borderRadius:50,backgroundColor:'#EEF2FF',justifyContent:'center',alignItems:'center'}}>
          <MaterialCommunityIcons name="tooth-outline" size={20} color="#4F46E5" />
          <Text style={{color:'#4F46E5',fontSize:11,fontWeight:'900',letterSpacing:0.3,marginTop:3,textAlign:'center',paddingHorizontal:8}} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 7. Crystal Glassmorphism ──
// Enhanced frosted glass with rainbow shimmer line top
export const ClinicNameSticker7: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <View style={{backgroundColor:'rgba(255,255,255,0.12)',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,0.3)'}}>
        <LinearGradient colors={['#6366F1','#EC4899','#F97316','#22C55E']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:2.5}} />
        <View style={{paddingVertical:13,paddingHorizontal:22,alignItems:'center'}}>
          <Text style={{color:'#FFFFFF',fontSize:17,fontWeight:'900',letterSpacing:1.2,textAlign:'center',textShadowColor:'rgba(0,0,0,0.5)',textShadowOffset:{width:0,height:1},textShadowRadius:6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </View>
    </View>
  );
};

// ── 8. Teal Medical Panel ──
// Teal gradient border with frosted medical compartment
export const ClinicNameSticker8: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#0D9488','#14B8A6','#2DD4BF']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2}}>
        <View style={{backgroundColor:'rgba(13,148,136,0.85)',borderRadius:14,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
          <View style={{width:28,height:28,borderRadius:8,backgroundColor:'rgba(255,255,255,0.15)',justifyContent:'center',alignItems:'center',marginRight:10}}>
            <Ionicons name="medical" size={15} color="#CCFBF1" />
          </View>
          <Text style={{color:'#FFFFFF',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 9. Craft Washi Tag ──
// Tilted kraft tag with double dashed border and warm handwritten feel
export const ClinicNameSticker9: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <View style={{backgroundColor:'#FFFBEB',borderRadius:6,padding:2.5,borderWidth:2,borderColor:'#92400E',transform:[{rotate:'-2deg'}]}}>
        <View style={{borderWidth:1,borderColor:'#D97706',borderStyle:'dashed',borderRadius:4,paddingVertical:10,paddingHorizontal:16,alignItems:'center'}}>
          <Text style={{color:'#92400E',fontSize:9,fontWeight:'500',fontFamily:Platform.OS==='ios'?'Noteworthy':'cursive',marginBottom:3}}>welcome to 🦷</Text>
          <Text style={{color:'#78350F',fontSize:16,fontWeight:'900',fontFamily:Platform.OS==='ios'?'Noteworthy-Bold':'cursive',letterSpacing:0.5,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </View>
    </View>
  );
};

// ── 10. Instagram Fire Ribbon ──
// Bold IG-style gradient with fire icon accent, slight rotation
export const ClinicNameSticker10: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ns.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#833AB4','#E91E63','#F77737']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:10,padding:2}}>
        <View style={{backgroundColor:'rgba(0,0,0,0.2)',borderRadius:8,paddingVertical:10,paddingHorizontal:22,alignItems:'center',transform:[{rotate:'-3deg'}]}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
            <Ionicons name="flame" size={12} color="#FBBF24" style={{marginRight:4}} />
            <Text style={{color:'#FDE68A',fontSize:8,fontWeight:'700',letterSpacing:2}}>TRENDING</Text>
          </View>
          <Text style={{color:'#FFFFFF',fontSize:17,fontWeight:'900',letterSpacing:1.5,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── Export registry ──
export const CLINIC_NAME_STICKER_DESIGNS = [
  { id: 'clinicname_1', label: 'Imperial Gold', Component: ClinicNameSticker1, clinicTypes: ['dental', 'beauty'] },
  { id: 'clinicname_2', label: 'Midnight Pulse', Component: ClinicNameSticker2, clinicTypes: ['dental'] },
  { id: 'clinicname_3', label: 'Aurora Pill', Component: ClinicNameSticker3, clinicTypes: ['dental'] },
  { id: 'clinicname_4', label: 'Matrix Neon', Component: ClinicNameSticker4, clinicTypes: ['laser'] },
  { id: 'clinicname_5', label: 'Heritage Crest', Component: ClinicNameSticker5, clinicTypes: ['dental'] },
  { id: 'clinicname_6', label: 'Indigo Ring', Component: ClinicNameSticker6, clinicTypes: ['dental'] },
  { id: 'clinicname_7', label: 'Crystal Glass', Component: ClinicNameSticker7, clinicTypes: ['laser', 'beauty'] },
  { id: 'clinicname_8', label: 'Teal Medical', Component: ClinicNameSticker8, clinicTypes: ['dental'] },
  { id: 'clinicname_9', label: 'Craft Tag', Component: ClinicNameSticker9, clinicTypes: ['beauty'] },
  { id: 'clinicname_10', label: 'IG Fire Ribbon', Component: ClinicNameSticker10, clinicTypes: ['dental', 'laser', 'beauty'] },
] as const;

const ns = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
