/**
 * Extended Clinic Name Sticker Designs (11–40) — Flagship Collection
 *
 * 30 premium clinic name sticker designs with layered visuals,
 * gradients, glassmorphism, neon effects, and creative typography.
 * Shown via search in the GIF picker modal.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ClinicNameStickerProps } from './ClinicNameStickers';

// ── 11. Sapphire Marquee ──
// Blue gradient border with frosted dark inner panel and star accents
export const ClinicNameSticker11: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#1E40AF','#3B82F6','#60A5FA']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2.5}}>
      <View style={{backgroundColor:'rgba(15,23,42,0.88)',borderRadius:14,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#93C5FD',fontSize:7,fontWeight:'600',letterSpacing:3,marginBottom:4}}>─── ✦ ───</Text>
        <Text style={{color:'#E2E8F0',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 12. Ember Sunset ──
// Warm tri-gradient border with dark inner field and fire accent
export const ClinicNameSticker12: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F97316','#EF4444','#DC2626']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.3)',borderRadius:20,paddingVertical:10,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 13. Jade Shield ──
// Deep emerald with gold accent bars and shield icon
export const ClinicNameSticker13: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#064E3B',borderRadius:14,overflow:'hidden',borderWidth:1.5,borderColor:'#34D399'}}>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
      <View style={{paddingVertical:10,paddingHorizontal:20,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:26,height:26,borderRadius:8,backgroundColor:'rgba(52,211,153,0.15)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#6EE7B7" />
        </View>
        <Text style={{color:'#ECFDF5',fontSize:15,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
    </View>
  </View>);
};

// ── 14. Amethyst Cloud ──
// Soft purple gradient border with lavender inner card
export const ClinicNameSticker14: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#A78BFA','#8B5CF6','#7C3AED']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:2}}>
      <View style={{backgroundColor:'#F5F3FF',borderRadius:20,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#5B21B6',fontSize:16,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 15. Stellar Gold ──
// Space-dark card with gold border and star-dot accent row
export const ClinicNameSticker15: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#0F172A',borderRadius:12,paddingVertical:12,paddingHorizontal:22,alignItems:'center',borderWidth:2,borderColor:'#F59E0B',...Platform.select({ios:{shadowColor:'#F59E0B',shadowOpacity:0.2,shadowRadius:8,shadowOffset:{width:0,height:0}},android:{elevation:5}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
        {[0,1,2].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#FBBF24',marginHorizontal:3}} />)}
      </View>
      <Text style={{color:'#FDE68A',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
    </View>
  </View>);
};

// ── 16. Arctic Frost ──
// Frosted icy card with diamond accent and crystalline border
export const ClinicNameSticker16: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#F0F9FF',borderRadius:16,paddingVertical:12,paddingHorizontal:22,alignItems:'center',borderWidth:2,borderColor:'#7DD3FC',...Platform.select({ios:{shadowColor:'#0EA5E9',shadowOpacity:0.12,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
        <View style={{width:14,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
        <Ionicons name="diamond-outline" size={10} color="#0284C7" style={{marginHorizontal:6}} />
        <View style={{width:14,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
      </View>
      <Text style={{color:'#0C4A6E',fontSize:15,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
    </View>
  </View>);
};

// ── 17. Crimson Ribbon ──
// Bold red gradient border with inner dark card
export const ClinicNameSticker17: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#B91C1C']} style={{borderRadius:12,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.25)',borderRadius:10,paddingVertical:10,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 18. Bronze Plate ──
// Metallic bronze gradient border with dark inner field and serif type
export const ClinicNameSticker18: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#92400E','#D97706','#F59E0B','#D97706','#92400E']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:10,padding:2.5}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:8,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#FEF3C7',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 19. Dental Mint Premium ──
// Mint gradient border with frosted card and tooth icon
export const ClinicNameSticker19: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#34D399','#10B981','#059669']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'#ECFDF5',borderRadius:16,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:24,height:24,borderRadius:7,backgroundColor:'#D1FAE5',justifyContent:'center',alignItems:'center',marginRight:8,borderWidth:1,borderColor:'#6EE7B7'}}>
          <MaterialCommunityIcons name="tooth" size={13} color="#059669" />
        </View>
        <Text style={{color:'#065F46',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 20. Purple Majesty ──
// Royal purple gradient border with dark inner field and crown dots
export const ClinicNameSticker20: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#7E22CE','#A855F7','#7E22CE']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:18,padding:2.5}}>
      <View style={{backgroundColor:'rgba(88,28,135,0.9)',borderRadius:16,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
          <View style={{width:7,height:7,borderRadius:3.5,backgroundColor:'#E9D5FF',marginHorizontal:5}} />
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
        </View>
        <Text style={{color:'#F3E8FF',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 21. Volcanic Warm ──
// Lava glow border with dark volcanic inner field
export const ClinicNameSticker21: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#EA580C','#F97316']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:16,padding:2,...Platform.select({ios:{shadowColor:'#EF4444',shadowOpacity:0.3,shadowRadius:10,shadowOffset:{width:0,height:0}},android:{elevation:5}})}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:14,paddingVertical:11,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#FED7AA',fontSize:15,fontWeight:'900',letterSpacing:0.8,textAlign:'center',textShadowColor:'#EF4444',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 22. Rose Petal ──
// Soft rose gradient border with pink inner card and floral accents
export const ClinicNameSticker22: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FDA4AF','#F43F5E','#FDA4AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:20,padding:2}}>
      <View style={{backgroundColor:'#FFF1F2',borderRadius:18,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <Text style={{fontSize:9}}>🌸</Text>
          <View style={{width:16,height:1,backgroundColor:'#FDA4AF',marginHorizontal:5}} />
          <Text style={{fontSize:9}}>🌸</Text>
        </View>
        <Text style={{color:'#9F1239',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 23. Pacific Wave ──
// Ocean gradient border with frosted blue inner panel
export const ClinicNameSticker23: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#0369A1','#0EA5E9','#38BDF8']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:24,padding:2}}>
      <View style={{backgroundColor:'rgba(3,105,161,0.85)',borderRadius:22,paddingVertical:10,paddingHorizontal:22,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:24,height:24,borderRadius:12,backgroundColor:'rgba(186,230,253,0.15)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="water" size={12} color="#BAE6FD" />
        </View>
        <Text style={{color:'#E0F2FE',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 24. Gunmetal Console ──
// Terminal-style card with window controls and monospace
export const ClinicNameSticker24: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#1E293B',borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'#334155'}}>
      <View style={{backgroundColor:'#0F172A',paddingVertical:4,paddingHorizontal:10,flexDirection:'row',alignItems:'center'}}>
        {['#EF4444','#FBBF24','#22C55E'].map((c,i)=><View key={i} style={{width:6,height:6,borderRadius:3,backgroundColor:c,marginRight:4}} />)}
      </View>
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#E2E8F0',fontSize:15,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </View>
  </View>);
};

// ── 25. Prismatic Frame ──
// Multi-color gradient frame with dark center
export const ClinicNameSticker25: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#818CF8','#C084FC','#F472B6','#FB923C']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:6,padding:2.5}}>
      <View style={{backgroundColor:'#1E1B4B',borderRadius:4,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#C4B5FD',fontSize:7,letterSpacing:3,marginBottom:4}}>◆ ◆ ◆</Text>
        <Text style={{color:'#E0E7FF',fontSize:16,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 26. Botanical Card ──
// Nature-green gradient border with leaf icon and organic shape
export const ClinicNameSticker26: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#14532D','#166534','#15803D']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'rgba(20,83,45,0.85)',borderRadius:16,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:26,height:26,borderRadius:13,backgroundColor:'rgba(187,247,208,0.12)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="leaf" size={13} color="#86EFAC" />
        </View>
        <Text style={{color:'#DCFCE7',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 27. Cyber Pink ──
// Double-glow neon pink border with dark inner field
export const ClinicNameSticker27: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:16,padding:2,backgroundColor:'#EC4899',...Platform.select({ios:{shadowColor:'#EC4899',shadowOpacity:0.6,shadowRadius:14,shadowOffset:{width:0,height:0}},android:{elevation:8}})}}>
      <View style={{backgroundColor:'#0A0A0A',borderRadius:14,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#F472B6',fontSize:16,fontWeight:'900',letterSpacing:1,textShadowColor:'#EC4899',textShadowRadius:10,textShadowOffset:{width:0,height:0},textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </View>
  </View>);
};

// ── 28. Sugar Rush Pill ──
// Candy gradient border with white inner card and emoji
export const ClinicNameSticker28: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F472B6','#A855F7','#6366F1']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:26,padding:2.5}}>
      <View style={{backgroundColor:'#FFF',borderRadius:24,paddingVertical:10,paddingHorizontal:20,flexDirection:'row',alignItems:'center'}}>
        <Text style={{fontSize:14,marginRight:6}}>🍬</Text>
        <Text style={{color:'#7C3AED',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 29. Bordeaux Signature ──
// Rich wine gradient border with serif font and star accents
export const ClinicNameSticker29: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9F1239','#881337','#9F1239']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:2}}>
      <View style={{backgroundColor:'rgba(136,19,55,0.9)',borderRadius:12,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#FECDD3',fontSize:7,fontWeight:'600',letterSpacing:3,marginBottom:4}}>✦ EXCLUSIVE ✦</Text>
        <Text style={{color:'#FFF',fontSize:15,fontWeight:'900',letterSpacing:1,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 30. Void Echo ──
// Ultra-dark with subtle edge glow lines top+bottom
export const ClinicNameSticker30: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#27272A'}}>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
      <View style={{paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#D4D4D8',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
    </View>
  </View>);
};

// ── 31. Plasma Bolt ──
// Electric cyan glow ring with lightning accent
export const ClinicNameSticker31: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:14,padding:2,backgroundColor:'#06B6D4',...Platform.select({ios:{shadowColor:'#06B6D4',shadowOpacity:0.5,shadowRadius:12,shadowOffset:{width:0,height:0}},android:{elevation:7}})}}>
      <View style={{backgroundColor:'#0E7490',borderRadius:12,paddingVertical:11,paddingHorizontal:20,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:24,height:24,borderRadius:12,backgroundColor:'rgba(207,250,254,0.15)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="flash" size={13} color="#CFFAFE" />
        </View>
        <Text style={{color:'#ECFEFF',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center',textShadowColor:'#22D3EE',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </View>
  </View>);
};

// ── 32. Desert Sunrise ──
// Warm sandy gradient border with sunrise accent on inner card
export const ClinicNameSticker32: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FBBF24','#F59E0B','#D97706']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2}}>
      <View style={{backgroundColor:'#FEF3C7',borderRadius:14,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:14,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
          <Text style={{color:'#D97706',fontSize:9,marginHorizontal:5}}>☀</Text>
          <View style={{width:14,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
        </View>
        <Text style={{color:'#78350F',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 33. Terminal Pro ──
// Enhanced terminal with green accent bars and monospace
export const ClinicNameSticker33: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:10,overflow:'hidden',borderWidth:1.5,borderColor:'#22C55E'}}>
      <View style={{height:2,backgroundColor:'#22C55E'}} />
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#4ADE80',fontSize:8,fontWeight:'600',letterSpacing:2,marginBottom:4}}>{'>'} CLINIC.SYS</Text>
        <Text style={{color:'#22C55E',fontSize:14,fontWeight:'900',letterSpacing:1.5,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </View>
  </View>);
};

// ── 34. Titanium Badge ──
// Industrial steel gradient border with rivet accents
export const ClinicNameSticker34: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9CA3AF','#6B7280','#4B5563','#6B7280','#9CA3AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:8,padding:2}}>
      <View style={{backgroundColor:'#374151',borderRadius:6,paddingVertical:12,paddingHorizontal:22,alignItems:'center',borderWidth:1,borderColor:'#6B7280'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          {[0,1,2,3].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#9CA3AF',marginHorizontal:3}} />)}
        </View>
        <Text style={{color:'#F9FAFB',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 35. Cloud Nine ──
// Light sky card with floating shadow layer and dashed edge
export const ClinicNameSticker35: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{position:'absolute',top:3,left:3,right:-3,height:44,borderRadius:12,backgroundColor:'rgba(56,189,248,0.1)'}} />
    <View style={{backgroundColor:'#E0F2FE',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:1.5,borderColor:'#7DD3FC',borderStyle:'dashed',...Platform.select({ios:{shadowColor:'#38BDF8',shadowOpacity:0.1,shadowRadius:6,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <Text style={{color:'#0C4A6E',fontSize:15,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
    </View>
  </View>);
};

// ── 36. Deep Sea Circle ──
// Circular aqua gradient border with pearl-white center
export const ClinicNameSticker36: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#22D3EE','#0891B2','#0E7490']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:104,height:104,borderRadius:52,padding:3,justifyContent:'center',alignItems:'center'}}>
      <View style={{width:98,height:98,borderRadius:49,backgroundColor:'#CFFAFE',justifyContent:'center',alignItems:'center'}}>
        <Text style={{color:'#164E63',fontSize:12,fontWeight:'900',letterSpacing:0.3,textAlign:'center',paddingHorizontal:10}} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 37. Gold Monospace ──
// Dark card with gold border and monospace typography
export const ClinicNameSticker37: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#1C1917',borderRadius:4,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:2,borderColor:'#D97706'}}>
      <Text style={{color:'#FDE68A',fontSize:14,fontWeight:'900',letterSpacing:2,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
    </View>
  </View>);
};

// ── 38. Swiss Minimal ──
// Ultra-clean white with red accent dot
export const ClinicNameSticker38: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#FFFFFF',borderRadius:4,paddingVertical:12,paddingHorizontal:22,alignItems:'center',...Platform.select({ios:{shadowColor:'#000',shadowOpacity:0.08,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:'#EF4444',marginRight:6}} />
        <View style={{width:20,height:1,backgroundColor:'#E5E7EB'}} />
      </View>
      <Text style={{color:'#111827',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
    </View>
  </View>);
};

// ── 39. Indigo Tilted ──
// Bold indigo gradient with creative tilt
export const ClinicNameSticker39: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#4338CA','#6366F1']} style={{borderRadius:10,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.2)',borderRadius:8,paddingVertical:10,paddingHorizontal:24,alignItems:'center',transform:[{rotate:'-3deg'}]}}>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 40. Peach Bloom ──
// Warm peach gradient border with soft inner card
export const ClinicNameSticker40: React.FC<ClinicNameStickerProps> = ({ clinicName, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FDBA74','#FB923C','#F97316']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'#FFF7ED',borderRadius:16,paddingVertical:12,paddingHorizontal:22,alignItems:'center'}}>
        <Text style={{color:'#7C2D12',fontSize:16,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── Export registry ──
const NAME_TAGS = ['name', 'clinic', 'brand', 'identity', 'title', 'business', 'logo', 'practice'] as const;

export const CLINIC_NAME_STICKER_DESIGNS_EXTENDED = [
  { id: 'clinicname_11', label: 'Sapphire Marquee', tags: [...NAME_TAGS, 'sapphire', 'marquee', 'blue', 'layered'], clinicTypes: ['dental', 'laser'], Component: ClinicNameSticker11 },
  { id: 'clinicname_12', label: 'Ember Sunset', tags: [...NAME_TAGS, 'ember', 'sunset', 'orange', 'warm'], clinicTypes: ['laser'], Component: ClinicNameSticker12 },
  { id: 'clinicname_13', label: 'Jade Shield', tags: [...NAME_TAGS, 'jade', 'shield', 'emerald', 'green'], clinicTypes: ['dental'], Component: ClinicNameSticker13 },
  { id: 'clinicname_14', label: 'Amethyst Cloud', tags: [...NAME_TAGS, 'amethyst', 'cloud', 'purple', 'soft'], clinicTypes: ['beauty'], Component: ClinicNameSticker14 },
  { id: 'clinicname_15', label: 'Stellar Gold', tags: [...NAME_TAGS, 'stellar', 'gold', 'dark', 'luxury'], clinicTypes: ['dental', 'laser'], Component: ClinicNameSticker15 },
  { id: 'clinicname_16', label: 'Arctic Frost', tags: [...NAME_TAGS, 'arctic', 'frost', 'ice', 'blue', 'cool'], clinicTypes: ['dental', 'laser'], Component: ClinicNameSticker16 },
  { id: 'clinicname_17', label: 'Crimson Ribbon', tags: [...NAME_TAGS, 'crimson', 'ribbon', 'red', 'bold'], clinicTypes: ['dental', 'laser'], Component: ClinicNameSticker17 },
  { id: 'clinicname_18', label: 'Bronze Plate', tags: [...NAME_TAGS, 'bronze', 'plate', 'copper', 'metallic'], clinicTypes: ['dental'], Component: ClinicNameSticker18 },
  { id: 'clinicname_19', label: 'Dental Mint', tags: [...NAME_TAGS, 'dental', 'mint', 'green', 'tooth', 'fresh'], clinicTypes: ['dental'], Component: ClinicNameSticker19 },
  { id: 'clinicname_20', label: 'Purple Majesty', tags: [...NAME_TAGS, 'purple', 'majesty', 'royal', 'luxury'], clinicTypes: ['beauty'], Component: ClinicNameSticker20 },
  { id: 'clinicname_21', label: 'Volcanic Warm', tags: [...NAME_TAGS, 'volcanic', 'warm', 'earth', 'lava'], clinicTypes: ['laser'], Component: ClinicNameSticker21 },
  { id: 'clinicname_22', label: 'Rose Petal', tags: [...NAME_TAGS, 'rose', 'petal', 'blush', 'pink', 'soft'], clinicTypes: ['beauty'], Component: ClinicNameSticker22 },
  { id: 'clinicname_23', label: 'Pacific Wave', tags: [...NAME_TAGS, 'pacific', 'wave', 'ocean', 'blue', 'sea'], clinicTypes: ['dental', 'beauty'], Component: ClinicNameSticker23 },
  { id: 'clinicname_24', label: 'Gunmetal Console', tags: [...NAME_TAGS, 'gunmetal', 'console', 'dark', 'tech'], clinicTypes: ['laser'], Component: ClinicNameSticker24 },
  { id: 'clinicname_25', label: 'Prismatic Frame', tags: [...NAME_TAGS, 'prismatic', 'frame', 'rainbow', 'elegant'], clinicTypes: ['laser', 'beauty'], Component: ClinicNameSticker25 },
  { id: 'clinicname_26', label: 'Botanical Card', tags: [...NAME_TAGS, 'botanical', 'card', 'forest', 'green', 'nature'], clinicTypes: ['beauty'], Component: ClinicNameSticker26 },
  { id: 'clinicname_27', label: 'Cyber Pink', tags: [...NAME_TAGS, 'cyber', 'pink', 'neon', 'glow', 'bright'], clinicTypes: ['laser', 'beauty'], Component: ClinicNameSticker27 },
  { id: 'clinicname_28', label: 'Sugar Rush', tags: [...NAME_TAGS, 'sugar', 'rush', 'candy', 'colorful', 'fun'], clinicTypes: ['beauty'], Component: ClinicNameSticker28 },
  { id: 'clinicname_29', label: 'Bordeaux Signature', tags: [...NAME_TAGS, 'bordeaux', 'signature', 'wine', 'luxury'], clinicTypes: ['dental', 'beauty'], Component: ClinicNameSticker29 },
  { id: 'clinicname_30', label: 'Void Echo', tags: [...NAME_TAGS, 'void', 'echo', 'obsidian', 'dark', 'sleek'], clinicTypes: ['laser'], Component: ClinicNameSticker30 },
  { id: 'clinicname_31', label: 'Plasma Bolt', tags: [...NAME_TAGS, 'plasma', 'bolt', 'electric', 'cyan', 'neon'], clinicTypes: ['laser'], Component: ClinicNameSticker31 },
  { id: 'clinicname_32', label: 'Desert Sunrise', tags: [...NAME_TAGS, 'desert', 'sunrise', 'warm', 'sand', 'gold'], clinicTypes: ['dental', 'beauty'], Component: ClinicNameSticker32 },
  { id: 'clinicname_33', label: 'Terminal Pro', tags: [...NAME_TAGS, 'terminal', 'pro', 'charcoal', 'monospace', 'hacker'], clinicTypes: ['laser'], Component: ClinicNameSticker33 },
  { id: 'clinicname_34', label: 'Titanium Badge', tags: [...NAME_TAGS, 'titanium', 'badge', 'steel', 'grey', 'metallic'], clinicTypes: ['dental', 'laser'], Component: ClinicNameSticker34 },
  { id: 'clinicname_35', label: 'Cloud Nine', tags: [...NAME_TAGS, 'cloud', 'nine', 'sky', 'blue', 'light'], clinicTypes: ['beauty'], Component: ClinicNameSticker35 },
  { id: 'clinicname_36', label: 'Deep Sea Circle', tags: [...NAME_TAGS, 'deep', 'sea', 'circle', 'aqua', 'teal'], clinicTypes: ['dental', 'beauty'], Component: ClinicNameSticker36 },
  { id: 'clinicname_37', label: 'Gold Monospace', tags: [...NAME_TAGS, 'gold', 'monospace', 'premium', 'dark'], clinicTypes: ['dental'], Component: ClinicNameSticker37 },
  { id: 'clinicname_38', label: 'Swiss Minimal', tags: [...NAME_TAGS, 'swiss', 'minimal', 'clean', 'white'], clinicTypes: ['dental', 'beauty'], Component: ClinicNameSticker38 },
  { id: 'clinicname_39', label: 'Indigo Tilted', tags: [...NAME_TAGS, 'indigo', 'tilted', 'angled', 'creative'], clinicTypes: ['laser'], Component: ClinicNameSticker39 },
  { id: 'clinicname_40', label: 'Peach Bloom', tags: [...NAME_TAGS, 'peach', 'bloom', 'warm', 'soft', 'orange'], clinicTypes: ['beauty'], Component: ClinicNameSticker40 },
];

const x = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
