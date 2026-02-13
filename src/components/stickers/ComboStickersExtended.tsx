/**
 * Extended Combo Sticker Designs (11–40) — Flagship Collection
 *
 * 30 premium combo stickers showing both clinic name and phone number.
 * Layered gradients, glassmorphism, neon glow, creative layouts.
 * Shown via search in the GIF picker modal.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ComboStickerProps } from './ComboStickers';

// ── 11. Sapphire Prism Duo ──
// Multi-layer blue gradient border on dark inner, phone in accent pill
export const ComboSticker11: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#1E40AF','#3B82F6','#60A5FA']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2.5}}>
      <View style={{backgroundColor:'rgba(15,23,42,0.88)',borderRadius:14,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#93C5FD',fontSize:7,fontWeight:'600',letterSpacing:3,marginBottom:3}}>─── ✦ ───</Text>
        <Text style={{color:'#E2E8F0',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:5,backgroundColor:'rgba(59,130,246,0.1)',borderRadius:10,paddingHorizontal:9,paddingVertical:2.5}}>
          <Ionicons name="call" size={9} color="#93C5FD" style={{marginRight:4}} />
          <Text style={{color:'#93C5FD',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── 12. Ember Wave Duo ──
// Warm tri-gradient border with dark inner, phone below divider
export const ComboSticker12: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F97316','#EF4444','#DC2626']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:14,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.3)',borderRadius:12,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FFF',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{width:40,height:1,backgroundColor:'#FECACA',marginVertical:5,opacity:0.6}} />
        <Text style={{color:'#FED7AA',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 13. Jade Shield Duo ──
// Emerald border with gold accent bars, shield icon, phone in green row
export const ComboSticker13: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#064E3B',borderRadius:14,overflow:'hidden',borderWidth:1.5,borderColor:'#34D399'}}>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <MaterialCommunityIcons name="shield-check" size={13} color="#6EE7B7" style={{marginRight:5}} />
          <Text style={{color:'#ECFDF5',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <Ionicons name="call" size={9} color="#A7F3D0" style={{marginRight:4}} />
          <Text style={{color:'#A7F3D0',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
    </View>
  </View>);
};

// ── 14. Amethyst Cloud Duo ──
// Soft purple gradient border with lavender inner card, phone below
export const ComboSticker14: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#A78BFA','#8B5CF6','#7C3AED']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:2}}>
      <View style={{backgroundColor:'#F5F3FF',borderRadius:20,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#5B21B6',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#7C3AED',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 15. Stellar Gold Duo ──
// Dark card with gold border, star dots, serif type, phone in gold
export const ComboSticker15: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#0F172A',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:2,borderColor:'#F59E0B',...Platform.select({ios:{shadowColor:'#F59E0B',shadowOpacity:0.2,shadowRadius:8,shadowOffset:{width:0,height:0}},android:{elevation:5}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
        {[0,1,2].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#FBBF24',marginHorizontal:3}} />)}
      </View>
      <Text style={{color:'#FDE68A',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      <View style={{flexDirection:'row',alignItems:'center',marginTop:5}}>
        <MaterialCommunityIcons name="phone-classic" size={10} color="#FBBF24" style={{marginRight:4}} />
        <Text style={{color:'#FCD34D',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 16. Arctic Frost Duo ──
// Frosted icy card with diamond accent, phone in cool blue
export const ComboSticker16: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#F0F9FF',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:2,borderColor:'#7DD3FC',...Platform.select({ios:{shadowColor:'#0EA5E9',shadowOpacity:0.1,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
        <View style={{width:14,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
        <Ionicons name="diamond-outline" size={10} color="#0284C7" style={{marginHorizontal:5}} />
        <View style={{width:14,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
      </View>
      <Text style={{color:'#0C4A6E',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      <Text style={{color:'#0369A1',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
    </View>
  </View>);
};

// ── 17. Crimson Ribbon Duo ──
// Bold red gradient border with dark inner card, phone in row
export const ComboSticker17: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#B91C1C']} style={{borderRadius:12,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.25)',borderRadius:10,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FFF',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{width:40,height:1,backgroundColor:'#FCA5A5',marginVertical:5,opacity:0.5}} />
        <Text style={{color:'#FECACA',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 18. Bronze Plate Duo ──
// Metallic bronze gradient border with dark inner, serif type
export const ComboSticker18: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#92400E','#D97706','#F59E0B','#D97706','#92400E']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:10,padding:2.5}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:8,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FEF3C7',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#FDE68A',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 19. Dental Mint Duo ──
// Mint gradient border with tooth icon badge, phone in green
export const ComboSticker19: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#34D399','#10B981','#059669']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'#ECFDF5',borderRadius:16,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <View style={{width:22,height:22,borderRadius:7,backgroundColor:'#D1FAE5',justifyContent:'center',alignItems:'center',marginRight:6,borderWidth:1,borderColor:'#6EE7B7'}}>
            <MaterialCommunityIcons name="tooth" size={12} color="#059669" />
          </View>
          <Text style={{color:'#065F46',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <Ionicons name="call-outline" size={9} color="#059669" style={{marginRight:4}} />
          <Text style={{color:'#047857',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── 20. Purple Majesty Duo ──
// Royal purple gradient border with dark inner, crown dots
export const ComboSticker20: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#7E22CE','#A855F7','#7E22CE']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:18,padding:2.5}}>
      <View style={{backgroundColor:'rgba(88,28,135,0.9)',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
          <View style={{width:7,height:7,borderRadius:3.5,backgroundColor:'#E9D5FF',marginHorizontal:5}} />
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
        </View>
        <Text style={{color:'#F3E8FF',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#D8B4FE',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 21. Volcanic Glow Duo ──
// Lava border with glow shadow on dark inner, phone with fire text shadow
export const ComboSticker21: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#EA580C','#F97316']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:16,padding:2,...Platform.select({ios:{shadowColor:'#EF4444',shadowOpacity:0.3,shadowRadius:10,shadowOffset:{width:0,height:0}},android:{elevation:5}})}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:14,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FED7AA',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center',textShadowColor:'#EF4444',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#FDBA74',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 22. Rose Petal Duo ──
// Rose gradient border with floral accents, phone in pink
export const ComboSticker22: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FDA4AF','#F43F5E','#FDA4AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:20,padding:2}}>
      <View style={{backgroundColor:'#FFF1F2',borderRadius:18,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <Text style={{fontSize:9}}>🌸</Text>
          <View style={{width:14,height:1,backgroundColor:'#FDA4AF',marginHorizontal:4}} />
          <Text style={{fontSize:9}}>🌸</Text>
        </View>
        <Text style={{color:'#9F1239',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
          <Ionicons name="call" size={9} color="#E11D48" style={{marginRight:4}} />
          <Text style={{color:'#E11D48',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── 23. Pacific Wave Duo ──
// Ocean gradient border with wave icon badge, phone inside
export const ComboSticker23: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#0369A1','#0EA5E9','#38BDF8']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:20,padding:2}}>
      <View style={{backgroundColor:'rgba(3,105,161,0.85)',borderRadius:18,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:'rgba(186,230,253,0.12)',justifyContent:'center',alignItems:'center',marginRight:6}}>
            <Ionicons name="water" size={11} color="#BAE6FD" />
          </View>
          <Text style={{color:'#E0F2FE',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <Text style={{color:'#BAE6FD',fontSize:10,fontWeight:'700',marginTop:2}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 24. Gunmetal Console Duo ──
// Terminal card with window controls, monospace phone
export const ComboSticker24: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#1E293B',borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'#334155'}}>
      <View style={{backgroundColor:'#0F172A',paddingVertical:4,paddingHorizontal:10,flexDirection:'row',alignItems:'center'}}>
        {['#EF4444','#FBBF24','#22C55E'].map((c,i)=><View key={i} style={{width:6,height:6,borderRadius:3,backgroundColor:c,marginRight:4}} />)}
      </View>
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#E2E8F0',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{width:40,height:1,backgroundColor:'#475569',marginVertical:5}} />
        <Text style={{color:'#94A3B8',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 25. Prismatic Frame Duo ──
// Multi-color gradient frame with dark center, diamond accents
export const ComboSticker25: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#818CF8','#C084FC','#F472B6','#FB923C']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:6,padding:2.5}}>
      <View style={{backgroundColor:'#1E1B4B',borderRadius:4,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#C4B5FD',fontSize:7,letterSpacing:3,marginBottom:3}}>◆ ◆ ◆</Text>
        <Text style={{color:'#E0E7FF',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#A5B4FC',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 26. Botanical Card Duo ──
// Nature-green gradient border with leaf icon, phone in organic style
export const ComboSticker26: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#14532D','#166534','#15803D']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'rgba(20,83,45,0.85)',borderRadius:16,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <Ionicons name="leaf" size={12} color="#86EFAC" style={{marginRight:5}} />
          <Text style={{color:'#DCFCE7',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <Text style={{color:'#86EFAC',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 27. Cyber Pink Duo ──
// Double-glow neon pink on dark, phone with neon text shadow
export const ComboSticker27: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:16,padding:2,backgroundColor:'#EC4899',...Platform.select({ios:{shadowColor:'#EC4899',shadowOpacity:0.6,shadowRadius:14,shadowOffset:{width:0,height:0}},android:{elevation:8}})}}>
      <View style={{backgroundColor:'#0A0A0A',borderRadius:14,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#F472B6',fontSize:14,fontWeight:'900',letterSpacing:1,textShadowColor:'#EC4899',textShadowRadius:10,textShadowOffset:{width:0,height:0},textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#F9A8D4',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 28. Sugar Rush Duo ──
// Candy gradient border with white inner, emoji accent
export const ComboSticker28: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F472B6','#A855F7','#6366F1']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:24,padding:2.5}}>
      <View style={{backgroundColor:'#FFF',borderRadius:22,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:2}}>
          <Text style={{fontSize:12,marginRight:5}}>🍬</Text>
          <Text style={{color:'#7C3AED',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <Text style={{color:'#A855F7',fontSize:10,fontWeight:'700',marginTop:2}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 29. Bordeaux Signature Duo ──
// Wine gradient border with serif type, exclusive label
export const ComboSticker29: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9F1239','#881337','#9F1239']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:2}}>
      <View style={{backgroundColor:'rgba(136,19,55,0.9)',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FECDD3',fontSize:7,fontWeight:'600',letterSpacing:3,marginBottom:3}}>✦ EXCLUSIVE ✦</Text>
        <Text style={{color:'#FFF',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center',fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#FECDD3',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 30. Void Echo Duo ──
// Ultra-dark with gradient edge lines, phone below divider
export const ComboSticker30: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#27272A'}}>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
      <View style={{paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#D4D4D8',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{width:40,height:1,backgroundColor:'#3F3F46',marginVertical:5}} />
        <Text style={{color:'#71717A',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
    </View>
  </View>);
};

// ── 31. Plasma Bolt Duo ──
// Electric cyan glow with flash icon, phone with glow
export const ComboSticker31: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:14,padding:2,backgroundColor:'#06B6D4',...Platform.select({ios:{shadowColor:'#06B6D4',shadowOpacity:0.5,shadowRadius:12,shadowOffset:{width:0,height:0}},android:{elevation:7}})}}>
      <View style={{backgroundColor:'#0E7490',borderRadius:12,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <Ionicons name="flash" size={12} color="#CFFAFE" style={{marginRight:5}} />
          <Text style={{color:'#ECFEFF',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center',textShadowColor:'#22D3EE',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        </View>
        <Text style={{color:'#67E8F9',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 32. Desert Sunrise Duo ──
// Warm sandy gradient border with sun accent, phone in warm tone
export const ComboSticker32: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FBBF24','#F59E0B','#D97706']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2}}>
      <View style={{backgroundColor:'#FEF3C7',borderRadius:14,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          <View style={{width:14,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
          <Text style={{color:'#D97706',fontSize:9,marginHorizontal:5}}>☀</Text>
          <View style={{width:14,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
        </View>
        <Text style={{color:'#78350F',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#92400E',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 33. Terminal Pro Duo ──
// Green-on-black terminal with cursor accent, monospace phone
export const ComboSticker33: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:10,overflow:'hidden',borderWidth:1.5,borderColor:'#22C55E'}}>
      <View style={{height:2,backgroundColor:'#22C55E'}} />
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#4ADE80',fontSize:7,fontWeight:'600',letterSpacing:2,marginBottom:3}}>{'>'} CLINIC.SYS</Text>
        <Text style={{color:'#22C55E',fontSize:13,fontWeight:'900',letterSpacing:1.5,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#4ADE80',fontSize:9,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Menlo':'monospace',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 34. Titanium Badge Duo ──
// Industrial steel gradient border with rivet dots
export const ComboSticker34: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9CA3AF','#6B7280','#4B5563','#6B7280','#9CA3AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:8,padding:2}}>
      <View style={{backgroundColor:'#374151',borderRadius:6,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:1,borderColor:'#6B7280'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:3}}>
          {[0,1,2,3].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#9CA3AF',marginHorizontal:3}} />)}
        </View>
        <Text style={{color:'#F9FAFB',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#D1D5DB',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 35. Cloud Nine Duo ──
// Light sky card with floating shadow, dashed border
export const ComboSticker35: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{position:'absolute',top:3,left:3,right:-3,height:52,borderRadius:12,backgroundColor:'rgba(56,189,248,0.08)'}} />
    <View style={{backgroundColor:'#E0F2FE',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:1.5,borderColor:'#7DD3FC',borderStyle:'dashed',...Platform.select({ios:{shadowColor:'#38BDF8',shadowOpacity:0.1,shadowRadius:6,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <Text style={{color:'#0C4A6E',fontSize:14,fontWeight:'900',letterSpacing:0.6,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      <Text style={{color:'#0369A1',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
    </View>
  </View>);
};

// ── 36. Deep Sea Circle Duo ──
// Circular aqua gradient border with name center, phone below
export const ComboSticker36: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#22D3EE','#0891B2','#0E7490']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:120,height:120,borderRadius:60,padding:3,justifyContent:'center',alignItems:'center'}}>
      <View style={{width:114,height:114,borderRadius:57,backgroundColor:'#CFFAFE',justifyContent:'center',alignItems:'center'}}>
        <Text style={{color:'#164E63',fontSize:11,fontWeight:'900',letterSpacing:0.3,textAlign:'center',paddingHorizontal:10}} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:3}}>
          <Ionicons name="call" size={8} color="#0891B2" style={{marginRight:3}} />
          <Text style={{color:'#0891B2',fontSize:8,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── 37. Gold Monospace Duo ──
// Dark card with gold border, monospace both name and phone
export const ComboSticker37: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#1C1917',borderRadius:4,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:2,borderColor:'#D97706'}}>
      <Text style={{color:'#FDE68A',fontSize:13,fontWeight:'900',letterSpacing:2,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      <Text style={{color:'#FBBF24',fontSize:9,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Menlo':'monospace',marginTop:4}}>{clinicPhoneNumber}</Text>
    </View>
  </View>);
};

// ── 38. Swiss Minimal Duo ──
// Ultra-clean white with red accent dot, phone in grey
export const ComboSticker38: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#FFFFFF',borderRadius:4,paddingVertical:12,paddingHorizontal:20,alignItems:'center',...Platform.select({ios:{shadowColor:'#000',shadowOpacity:0.08,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:'#EF4444',marginRight:6}} />
        <View style={{width:20,height:1,backgroundColor:'#E5E7EB'}} />
      </View>
      <Text style={{color:'#111827',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
      <Text style={{color:'#6B7280',fontSize:10,fontWeight:'700',marginTop:4}}>{clinicPhoneNumber}</Text>
    </View>
  </View>);
};

// ── 39. Indigo Tilted Duo ──
// Creative tilted indigo gradient, phone at subtle angle
export const ComboSticker39: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#4338CA','#6366F1']} style={{borderRadius:10,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.2)',borderRadius:8,paddingVertical:10,paddingHorizontal:22,alignItems:'center',transform:[{rotate:'-3deg'}]}}>
        <Text style={{color:'#FFF',fontSize:14,fontWeight:'900',letterSpacing:1,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <Text style={{color:'#C7D2FE',fontSize:10,fontWeight:'700',marginTop:3}}>{clinicPhoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 40. Peach Bloom Duo ──
// Warm peach gradient border with soft inner card, phone below
export const ComboSticker40: React.FC<ComboStickerProps> = ({ clinicName, clinicPhoneNumber, size = 160 }) => {
  const s = size / 160;
  return (<View style={[z.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FDBA74','#FB923C','#F97316']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'#FFF7ED',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#7C2D12',fontSize:14,fontWeight:'900',letterSpacing:0.8,textAlign:'center'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{clinicName}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
          <Ionicons name="call" size={9} color="#9A3412" style={{marginRight:4}} />
          <Text style={{color:'#9A3412',fontSize:10,fontWeight:'700'}}>{clinicPhoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── Export registry ──
const COMBO_TAGS = ['combo', 'clinic', 'phone', 'name', 'identity', 'contact', 'call', 'brand', 'business', 'info', 'card'] as const;

export const COMBO_STICKER_DESIGNS_EXTENDED = [
  { id: 'combo_11', label: 'Sapphire Prism', tags: [...COMBO_TAGS, 'sapphire', 'prism', 'blue', 'layered'], clinicTypes: ['dental', 'laser'], Component: ComboSticker11 },
  { id: 'combo_12', label: 'Ember Wave', tags: [...COMBO_TAGS, 'ember', 'wave', 'orange', 'warm'], clinicTypes: ['laser'], Component: ComboSticker12 },
  { id: 'combo_13', label: 'Jade Shield', tags: [...COMBO_TAGS, 'jade', 'shield', 'emerald', 'green'], clinicTypes: ['dental'], Component: ComboSticker13 },
  { id: 'combo_14', label: 'Amethyst Cloud', tags: [...COMBO_TAGS, 'amethyst', 'cloud', 'purple', 'soft'], clinicTypes: ['beauty'], Component: ComboSticker14 },
  { id: 'combo_15', label: 'Stellar Gold', tags: [...COMBO_TAGS, 'stellar', 'gold', 'dark', 'luxury'], clinicTypes: ['dental', 'laser'], Component: ComboSticker15 },
  { id: 'combo_16', label: 'Arctic Frost', tags: [...COMBO_TAGS, 'arctic', 'frost', 'ice', 'blue', 'cool'], clinicTypes: ['dental', 'laser'], Component: ComboSticker16 },
  { id: 'combo_17', label: 'Crimson Ribbon', tags: [...COMBO_TAGS, 'crimson', 'ribbon', 'red', 'bold'], clinicTypes: ['dental', 'laser'], Component: ComboSticker17 },
  { id: 'combo_18', label: 'Bronze Plate', tags: [...COMBO_TAGS, 'bronze', 'plate', 'copper', 'metallic'], clinicTypes: ['dental'], Component: ComboSticker18 },
  { id: 'combo_19', label: 'Dental Mint', tags: [...COMBO_TAGS, 'dental', 'mint', 'green', 'tooth', 'fresh'], clinicTypes: ['dental'], Component: ComboSticker19 },
  { id: 'combo_20', label: 'Purple Majesty', tags: [...COMBO_TAGS, 'purple', 'majesty', 'royal', 'luxury'], clinicTypes: ['beauty'], Component: ComboSticker20 },
  { id: 'combo_21', label: 'Volcanic Glow', tags: [...COMBO_TAGS, 'volcanic', 'glow', 'earth', 'lava'], clinicTypes: ['laser'], Component: ComboSticker21 },
  { id: 'combo_22', label: 'Rose Petal', tags: [...COMBO_TAGS, 'rose', 'petal', 'blush', 'pink', 'soft'], clinicTypes: ['beauty'], Component: ComboSticker22 },
  { id: 'combo_23', label: 'Pacific Wave', tags: [...COMBO_TAGS, 'pacific', 'wave', 'ocean', 'blue', 'sea'], clinicTypes: ['dental', 'beauty'], Component: ComboSticker23 },
  { id: 'combo_24', label: 'Gunmetal Console', tags: [...COMBO_TAGS, 'gunmetal', 'console', 'dark', 'tech'], clinicTypes: ['laser'], Component: ComboSticker24 },
  { id: 'combo_25', label: 'Prismatic Frame', tags: [...COMBO_TAGS, 'prismatic', 'frame', 'rainbow', 'elegant'], clinicTypes: ['laser', 'beauty'], Component: ComboSticker25 },
  { id: 'combo_26', label: 'Botanical Card', tags: [...COMBO_TAGS, 'botanical', 'card', 'forest', 'green', 'nature'], clinicTypes: ['beauty'], Component: ComboSticker26 },
  { id: 'combo_27', label: 'Cyber Pink', tags: [...COMBO_TAGS, 'cyber', 'pink', 'neon', 'glow', 'bright'], clinicTypes: ['laser', 'beauty'], Component: ComboSticker27 },
  { id: 'combo_28', label: 'Sugar Rush', tags: [...COMBO_TAGS, 'sugar', 'rush', 'candy', 'colorful', 'fun'], clinicTypes: ['beauty'], Component: ComboSticker28 },
  { id: 'combo_29', label: 'Bordeaux Signature', tags: [...COMBO_TAGS, 'bordeaux', 'signature', 'wine', 'luxury'], clinicTypes: ['dental', 'beauty'], Component: ComboSticker29 },
  { id: 'combo_30', label: 'Void Echo', tags: [...COMBO_TAGS, 'void', 'echo', 'obsidian', 'dark', 'sleek'], clinicTypes: ['laser'], Component: ComboSticker30 },
  { id: 'combo_31', label: 'Plasma Bolt', tags: [...COMBO_TAGS, 'plasma', 'bolt', 'electric', 'cyan', 'neon'], clinicTypes: ['laser'], Component: ComboSticker31 },
  { id: 'combo_32', label: 'Desert Sunrise', tags: [...COMBO_TAGS, 'desert', 'sunrise', 'warm', 'sand', 'gold'], clinicTypes: ['dental', 'beauty'], Component: ComboSticker32 },
  { id: 'combo_33', label: 'Terminal Pro', tags: [...COMBO_TAGS, 'terminal', 'pro', 'charcoal', 'monospace', 'hacker'], clinicTypes: ['laser'], Component: ComboSticker33 },
  { id: 'combo_34', label: 'Titanium Badge', tags: [...COMBO_TAGS, 'titanium', 'badge', 'steel', 'grey', 'metallic'], clinicTypes: ['dental', 'laser'], Component: ComboSticker34 },
  { id: 'combo_35', label: 'Cloud Nine', tags: [...COMBO_TAGS, 'cloud', 'nine', 'sky', 'blue', 'light'], clinicTypes: ['beauty'], Component: ComboSticker35 },
  { id: 'combo_36', label: 'Deep Sea Circle', tags: [...COMBO_TAGS, 'deep', 'sea', 'circle', 'aqua', 'teal'], clinicTypes: ['dental', 'beauty'], Component: ComboSticker36 },
  { id: 'combo_37', label: 'Gold Monospace', tags: [...COMBO_TAGS, 'gold', 'monospace', 'premium', 'dark'], clinicTypes: ['dental'], Component: ComboSticker37 },
  { id: 'combo_38', label: 'Swiss Minimal', tags: [...COMBO_TAGS, 'swiss', 'minimal', 'clean', 'white'], clinicTypes: ['dental', 'beauty'], Component: ComboSticker38 },
  { id: 'combo_39', label: 'Indigo Tilted', tags: [...COMBO_TAGS, 'indigo', 'tilted', 'angled', 'creative'], clinicTypes: ['laser'], Component: ComboSticker39 },
  { id: 'combo_40', label: 'Peach Bloom', tags: [...COMBO_TAGS, 'peach', 'bloom', 'warm', 'soft', 'orange'], clinicTypes: ['beauty'], Component: ComboSticker40 },
];

const z = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
