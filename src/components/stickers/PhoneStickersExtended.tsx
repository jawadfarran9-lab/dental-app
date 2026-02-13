/**
 * Extended Phone Sticker Designs (11–40) — Flagship Collection
 *
 * 30 premium phone sticker designs with layered visuals, gradients,
 * glassmorphism, neon effects, and creative typography.
 * Shown via search in the GIF picker modal.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PhoneStickerProps } from './PhoneStickers';

// ── 11. Sapphire Prism ──
// Multi-layer blue gradient border with frosted inner panel
export const PhoneSticker11: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#1E40AF','#3B82F6','#60A5FA']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:20,padding:2.5}}>
      <View style={{backgroundColor:'rgba(15,23,42,0.88)',borderRadius:17,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:28,height:28,borderRadius:14,backgroundColor:'rgba(59,130,246,0.2)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="shield-checkmark" size={14} color="#93C5FD" />
        </View>
        <View>
          <Text style={{color:'#64748B',fontSize:7,fontWeight:'700',letterSpacing:2}}>VERIFIED</Text>
          <Text style={{color:'#E2E8F0',fontSize:15,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>);
};

// ── 12. Ember Wave ──
// Warm tri-gradient with inner flame icon and accent bar
export const PhoneSticker12: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F97316','#EF4444','#DC2626']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.3)',borderRadius:16,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <Text style={{fontSize:12,marginRight:4}}>🔥</Text>
          <Text style={{color:'#FDBA74',fontSize:8,fontWeight:'700',letterSpacing:2}}>HOT LINE</Text>
        </View>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 13. Arctic Frost Panel ──
// Frosted icy card with crystalline border and diamond accent
export const PhoneSticker13: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#F0F9FF',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center',borderWidth:2,borderColor:'#7DD3FC',...Platform.select({ios:{shadowColor:'#0EA5E9',shadowOpacity:0.15,shadowRadius:10,shadowOffset:{width:0,height:3}},android:{elevation:4}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
        <View style={{width:16,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
        <Ionicons name="diamond-outline" size={10} color="#0284C7" style={{marginHorizontal:6}} />
        <View style={{width:16,height:1.5,backgroundColor:'#7DD3FC',borderRadius:1}} />
      </View>
      <Text style={{color:'#0C4A6E',fontSize:16,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
    </View>
  </View>);
};

// ── 14. Jade Dynasty ──
// Deep emerald with gold accent dividers and layered dark background
export const PhoneSticker14: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#064E3B','#065F46']} style={{borderRadius:14,overflow:'hidden',borderWidth:1.5,borderColor:'#34D399'}}>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
      <View style={{paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:28,height:28,borderRadius:8,backgroundColor:'rgba(52,211,153,0.15)',justifyContent:'center',alignItems:'center',marginRight:10}}>
          <Ionicons name="call" size={14} color="#6EE7B7" />
        </View>
        <Text style={{color:'#ECFDF5',fontSize:15,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
      <View style={{height:2.5,backgroundColor:'#D4A017'}} />
    </LinearGradient>
  </View>);
};

// ── 15. Volcanic Pulse ──
// Dark volcanic card with lava-glow border ring
export const PhoneSticker15: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#EA580C','#F97316']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:18,padding:2,...Platform.select({ios:{shadowColor:'#EF4444',shadowOpacity:0.4,shadowRadius:12,shadowOffset:{width:0,height:0}},android:{elevation:6}})}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:16,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#EF4444',fontSize:8,fontWeight:'700',letterSpacing:2,marginBottom:4}}>◉ DIRECT LINE</Text>
        <Text style={{color:'#FED7AA',fontSize:16,fontWeight:'900',letterSpacing:1,textShadowColor:'#EF4444',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 16. Amethyst Cloud ──
// Soft layered purple with gradient border and cloud-like rounded shape
export const PhoneSticker16: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#A78BFA','#8B5CF6','#7C3AED']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:24,padding:2}}>
      <View style={{backgroundColor:'#F5F3FF',borderRadius:22,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Ionicons name="call" size={14} color="#7C3AED" style={{marginBottom:4}} />
        <Text style={{color:'#5B21B6',fontSize:15,fontWeight:'900',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 17. Stellar Command ──
// Space-dark card with star-dot accent row and amber glow border
export const PhoneSticker17: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#0F172A',borderRadius:14,paddingVertical:12,paddingHorizontal:18,alignItems:'center',borderWidth:2,borderColor:'#F59E0B',...Platform.select({ios:{shadowColor:'#F59E0B',shadowOpacity:0.25,shadowRadius:8,shadowOffset:{width:0,height:0}},android:{elevation:5}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
        {[0,1,2].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#FBBF24',marginHorizontal:3}} />)}
      </View>
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <Ionicons name="call" size={13} color="#F59E0B" style={{marginRight:8}} />
        <Text style={{color:'#FDE68A',fontSize:15,fontWeight:'900',letterSpacing:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 18. Crystal Pane ──
// Enhanced glassmorphism with rainbow-edge shimmer line
export const PhoneSticker18: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'rgba(255,255,255,0.12)',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,0.3)'}}>
      <LinearGradient colors={['#6366F1','#EC4899','#F97316']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:2.5}} />
      <View style={{paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:1.2,textShadowColor:'rgba(0,0,0,0.5)',textShadowOffset:{width:0,height:1},textShadowRadius:6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 19. Crimson Alert ──
// Bold layered emergency-style card with icon badge
export const PhoneSticker19: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#DC2626','#B91C1C']} style={{borderRadius:14,padding:2}}>
      <View style={{backgroundColor:'rgba(0,0,0,0.25)',borderRadius:12,paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:20,height:20,borderRadius:10,backgroundColor:'rgba(254,202,202,0.2)',justifyContent:'center',alignItems:'center',marginRight:6}}>
            <Ionicons name="alert-circle" size={12} color="#FCA5A5" />
          </View>
          <Text style={{color:'#FECACA',fontSize:8,fontWeight:'700',letterSpacing:2}}>URGENT</Text>
        </View>
        <Text style={{color:'#FFF',fontSize:16,fontWeight:'900',letterSpacing:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 20. Pacific Crest ──
// Ocean gradient pill with wave accent and inner circle icon
export const PhoneSticker20: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#0369A1','#0EA5E9','#38BDF8']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:26,padding:2}}>
      <View style={{backgroundColor:'rgba(3,105,161,0.85)',borderRadius:24,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:26,height:26,borderRadius:13,backgroundColor:'rgba(186,230,253,0.15)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="water" size={13} color="#BAE6FD" />
        </View>
        <Text style={{color:'#E0F2FE',fontSize:15,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 21. Vintage Telegraph ──
// Kraft retro with double border, stamp-style rotation, monospace
export const PhoneSticker21: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#FFFBEB',borderRadius:4,paddingVertical:2,paddingHorizontal:2,borderWidth:2.5,borderColor:'#92400E',transform:[{rotate:'2deg'}]}}>
      <View style={{borderWidth:1,borderColor:'#D97706',borderStyle:'dashed',borderRadius:2,paddingVertical:8,paddingHorizontal:14,alignItems:'center'}}>
        <Text style={{color:'#92400E',fontSize:8,fontWeight:'700',letterSpacing:3,textTransform:'uppercase',marginBottom:3}}>☎ TELEGRAPH</Text>
        <Text style={{color:'#78350F',fontSize:15,fontWeight:'900',letterSpacing:1.5,fontFamily:Platform.OS==='ios'?'Courier':'monospace'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 22. Dental Premium ──
// Mint gradient border with tooth icon in frosted container
export const PhoneSticker22: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#34D399','#10B981','#059669']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:18,padding:2}}>
      <View style={{backgroundColor:'#ECFDF5',borderRadius:16,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:26,height:26,borderRadius:8,backgroundColor:'#D1FAE5',justifyContent:'center',alignItems:'center',marginRight:8,borderWidth:1,borderColor:'#6EE7B7'}}>
          <MaterialCommunityIcons name="tooth" size={14} color="#059669" />
        </View>
        <Text style={{color:'#065F46',fontSize:15,fontWeight:'900',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 23. Gunmetal Console ──
// Terminal-style dark card with blinking cursor accent and monospace
export const PhoneSticker23: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#1E293B',borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'#334155'}}>
      <View style={{backgroundColor:'#0F172A',paddingVertical:4,paddingHorizontal:12,flexDirection:'row',alignItems:'center'}}>
        {['#EF4444','#FBBF24','#22C55E'].map((c,i)=><View key={i} style={{width:6,height:6,borderRadius:3,backgroundColor:c,marginRight:4}} />)}
      </View>
      <View style={{paddingVertical:10,paddingHorizontal:16,alignItems:'center'}}>
        <Text style={{color:'#64748B',fontSize:8,fontWeight:'600',letterSpacing:2,marginBottom:4}}>$ contact --dial</Text>
        <Text style={{color:'#E2E8F0',fontSize:15,fontWeight:'900',letterSpacing:1.5,fontFamily:Platform.OS==='ios'?'Menlo':'monospace'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 24. Sugar Rush ──
// Playful candy gradient border with inner white card and emoji
export const PhoneSticker24: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#F472B6','#A855F7','#6366F1']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:22,padding:2.5}}>
      <View style={{backgroundColor:'#FFF',borderRadius:19,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <Text style={{fontSize:16,marginRight:6}}>🍬</Text>
        <Text style={{color:'#7C3AED',fontSize:15,fontWeight:'900',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 25. Prismatic Frame ──
// Multi-color gradient frame with centered text on dark background
export const PhoneSticker25: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#818CF8','#C084FC','#F472B6','#FB923C']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:4,padding:2.5}}>
      <View style={{backgroundColor:'#1E1B4B',borderRadius:2,paddingVertical:12,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#C4B5FD',fontSize:7,letterSpacing:3,marginBottom:4}}>◆ ◆ ◆</Text>
        <Text style={{color:'#E0E7FF',fontSize:15,fontWeight:'900',letterSpacing:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 26. Bronze Medal ──
// Metallic bronze gradient border with inner dark field
export const PhoneSticker26: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#92400E','#D97706','#F59E0B','#D97706','#92400E']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:12,padding:2.5}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:10,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <Ionicons name="call" size={13} color="#FDE68A" style={{marginRight:8}} />
        <Text style={{color:'#FEF3C7',fontSize:15,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 27. Cyber Pink ──
// Double-glow neon pink with layered shadow and inner ring
export const PhoneSticker27: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:16,padding:2,backgroundColor:'#EC4899',...Platform.select({ios:{shadowColor:'#EC4899',shadowOpacity:0.6,shadowRadius:16,shadowOffset:{width:0,height:0}},android:{elevation:8}})}}>
      <View style={{backgroundColor:'#0A0A0A',borderRadius:14,paddingVertical:12,paddingHorizontal:18,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:8,height:8,borderRadius:4,backgroundColor:'#EC4899',marginRight:6}} />
          <Text style={{color:'#F9A8D4',fontSize:8,fontWeight:'700',letterSpacing:2}}>CALLING</Text>
        </View>
        <Text style={{color:'#F472B6',fontSize:16,fontWeight:'900',letterSpacing:1,textShadowColor:'#EC4899',textShadowRadius:10,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 28. Swiss Minimal ──
// Ultra-clean white with red accent dot and Helvetica-style precision
export const PhoneSticker28: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#FFFFFF',borderRadius:4,paddingVertical:12,paddingHorizontal:20,alignItems:'center',...Platform.select({ios:{shadowColor:'#000',shadowOpacity:0.08,shadowRadius:8,shadowOffset:{width:0,height:2}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:6}}>
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:'#EF4444',marginRight:6}} />
        <View style={{width:24,height:1,backgroundColor:'#E5E7EB'}} />
      </View>
      <Text style={{color:'#111827',fontSize:16,fontWeight:'900',letterSpacing:1.5}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
    </View>
  </View>);
};

// ── 29. Botanical Card ──
// Nature-green gradient with leaf-lined icon and organic shape
export const PhoneSticker29: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#14532D','#166534','#15803D']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:20,padding:2}}>
      <View style={{backgroundColor:'rgba(20,83,45,0.85)',borderRadius:18,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:28,height:28,borderRadius:14,backgroundColor:'rgba(187,247,208,0.12)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="leaf" size={14} color="#86EFAC" />
        </View>
        <Text style={{color:'#DCFCE7',fontSize:15,fontWeight:'800',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 30. Titanium Badge ──
// Industrial steel gradient with riveted border and monospace
export const PhoneSticker30: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9CA3AF','#6B7280','#4B5563','#6B7280','#9CA3AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:8,padding:2}}>
      <View style={{backgroundColor:'#374151',borderRadius:6,paddingVertical:10,paddingHorizontal:18,alignItems:'center',borderWidth:1,borderColor:'#6B7280'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          {[0,1,2,3].map(i=><View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:'#9CA3AF',marginHorizontal:4}} />)}
        </View>
        <Text style={{color:'#F9FAFB',fontSize:15,fontWeight:'900',letterSpacing:2,fontFamily:Platform.OS==='ios'?'Courier':'monospace'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 31. Purple Majesty ──
// Royal purple gradient border with crown-like accent dots
export const PhoneSticker31: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#7E22CE','#A855F7','#7E22CE']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:18,padding:2.5}}>
      <View style={{backgroundColor:'rgba(88,28,135,0.9)',borderRadius:16,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
          <View style={{width:7,height:7,borderRadius:3.5,backgroundColor:'#E9D5FF',marginHorizontal:6}} />
          <View style={{width:5,height:5,borderRadius:2.5,backgroundColor:'#D8B4FE'}} />
        </View>
        <Text style={{color:'#F3E8FF',fontSize:15,fontWeight:'900',letterSpacing:1}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 32. Rose Petal ──
// Soft rose gradient border with petal-pink inner card
export const PhoneSticker32: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FDA4AF','#F43F5E','#FDA4AF']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:20,padding:2}}>
      <View style={{backgroundColor:'#FFF1F2',borderRadius:18,paddingVertical:11,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <Text style={{fontSize:10}}>🌸</Text>
          <View style={{width:20,height:1,backgroundColor:'#FDA4AF',marginHorizontal:6}} />
          <Text style={{fontSize:10}}>🌸</Text>
        </View>
        <Text style={{color:'#9F1239',fontSize:15,fontWeight:'900',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 33. Plasma Bolt ──
// Electric cyan with lightning icon and neon glow ring
export const PhoneSticker33: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{borderRadius:14,padding:2,backgroundColor:'#06B6D4',...Platform.select({ios:{shadowColor:'#06B6D4',shadowOpacity:0.5,shadowRadius:14,shadowOffset:{width:0,height:0}},android:{elevation:7}})}}>
      <View style={{backgroundColor:'#0E7490',borderRadius:12,paddingVertical:10,paddingHorizontal:18,flexDirection:'row',alignItems:'center'}}>
        <View style={{width:26,height:26,borderRadius:13,backgroundColor:'rgba(207,250,254,0.15)',justifyContent:'center',alignItems:'center',marginRight:8}}>
          <Ionicons name="flash" size={14} color="#CFFAFE" />
        </View>
        <Text style={{color:'#ECFEFF',fontSize:15,fontWeight:'900',letterSpacing:0.8,textShadowColor:'#22D3EE',textShadowRadius:6,textShadowOffset:{width:0,height:0}}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </View>
  </View>);
};

// ── 34. Desert Sunrise ──
// Warm sandy gradient border with sunrise accent on dark field
export const PhoneSticker34: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#FBBF24','#F59E0B','#D97706']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:16,padding:2}}>
      <View style={{backgroundColor:'#FEF3C7',borderRadius:14,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:16,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
          <Text style={{color:'#D97706',fontSize:10,marginHorizontal:6}}>☀</Text>
          <View style={{width:16,height:1.5,backgroundColor:'#D97706',borderRadius:1}} />
        </View>
        <Text style={{color:'#78350F',fontSize:15,fontWeight:'900',letterSpacing:0.8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 35. Terminal Pro ──
// Enhanced terminal with green-on-black and cursor blink accent
export const PhoneSticker35: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:10,overflow:'hidden',borderWidth:1.5,borderColor:'#22C55E'}}>
      <View style={{height:2,backgroundColor:'#22C55E'}} />
      <View style={{paddingVertical:10,paddingHorizontal:16,alignItems:'center'}}>
        <Text style={{color:'#4ADE80',fontSize:8,fontWeight:'600',letterSpacing:2,marginBottom:4}}>{'>'} CONNECTING...</Text>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <Text style={{color:'#22C55E',fontSize:15,fontWeight:'900',letterSpacing:2,fontFamily:Platform.OS==='ios'?'Menlo':'monospace'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
          <View style={{width:2,height:14,backgroundColor:'#22C55E',marginLeft:3}} />
        </View>
      </View>
    </View>
  </View>);
};

// ── 36. Deep Sea Pearl ──
// Circular aqua gradient border with pearl-white center and phone icon
export const PhoneSticker36: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#22D3EE','#0891B2','#0E7490']} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:104,height:104,borderRadius:52,padding:3,justifyContent:'center',alignItems:'center'}}>
      <View style={{width:98,height:98,borderRadius:49,backgroundColor:'#CFFAFE',justifyContent:'center',alignItems:'center'}}>
        <Ionicons name="call" size={16} color="#0891B2" />
        <Text style={{color:'#164E63',fontSize:11,fontWeight:'900',marginTop:3,textAlign:'center',paddingHorizontal:8}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 37. Bordeaux Signature ──
// Rich wine gradient border with serif font and star accents
export const PhoneSticker37: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#9F1239','#881337','#9F1239']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:2}}>
      <View style={{backgroundColor:'rgba(136,19,55,0.9)',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <Text style={{color:'#FECDD3',fontSize:7,fontWeight:'600',letterSpacing:3,marginBottom:4}}>✦ EXCLUSIVE ✦</Text>
        <Text style={{color:'#FFF',fontSize:15,fontWeight:'900',letterSpacing:1,fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 38. Cloud Nine ──
// Light sky card with floating shadow layers and dashed edge
export const PhoneSticker38: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{position:'absolute',top:3,left:3,right:-3,height:46,borderRadius:14,backgroundColor:'rgba(56,189,248,0.1)'}} />
    <View style={{backgroundColor:'#E0F2FE',borderRadius:14,paddingVertical:10,paddingHorizontal:18,alignItems:'center',borderWidth:1.5,borderColor:'#7DD3FC',borderStyle:'dashed',...Platform.select({ios:{shadowColor:'#38BDF8',shadowOpacity:0.12,shadowRadius:8,shadowOffset:{width:0,height:3}},android:{elevation:3}})}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
        <Ionicons name="cloud-outline" size={12} color="#0284C7" style={{marginRight:4}} />
        <Text style={{color:'#0369A1',fontSize:8,fontWeight:'700',letterSpacing:1.5}}>REACH US</Text>
      </View>
      <Text style={{color:'#0C4A6E',fontSize:15,fontWeight:'900',letterSpacing:0.6}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
    </View>
  </View>);
};

// ── 39. Void Echo ──
// Ultra-dark with subtle edge glow and type-label accent
export const PhoneSticker39: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <View style={{backgroundColor:'#09090B',borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:'#27272A',...Platform.select({ios:{shadowColor:'#71717A',shadowOpacity:0.15,shadowRadius:10,shadowOffset:{width:0,height:0}},android:{elevation:4}})}}>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
      <View style={{paddingVertical:10,paddingHorizontal:18,alignItems:'center'}}>
        <Text style={{color:'#52525B',fontSize:8,fontWeight:'700',letterSpacing:2,marginBottom:4}}>TAP TO CALL</Text>
        <Text style={{color:'#D4D4D8',fontSize:16,fontWeight:'900',letterSpacing:1.2}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
      <LinearGradient colors={['#27272A','#3F3F46','#27272A']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:1.5}} />
    </View>
  </View>);
};

// ── 40. Imperial Seal ──
// Gold seal with ornate multi-layer gradient border and serif type
export const PhoneSticker40: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (<View style={[x.c,{transform:[{scale:s}]}]}>
    <LinearGradient colors={['#B45309','#D97706','#FBBF24','#D97706','#B45309']} start={{x:0,y:0}} end={{x:1,y:0}} style={{borderRadius:14,padding:2.5}}>
      <View style={{backgroundColor:'#1C1917',borderRadius:12,paddingVertical:12,paddingHorizontal:20,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:4}}>
          <View style={{width:14,height:1,backgroundColor:'#D97706'}} />
          <Ionicons name="call" size={12} color="#FDE68A" style={{marginHorizontal:6}} />
          <View style={{width:14,height:1,backgroundColor:'#D97706'}} />
        </View>
        <Text style={{color:'#FEF3C7',fontSize:15,fontWeight:'900',letterSpacing:1,fontFamily:Platform.OS==='ios'?'Georgia':'serif'}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── Export registry ──
const PHONE_TAGS = ['phone', 'call', 'number', 'contact', 'dial', 'telephone', 'mobile', 'reach'] as const;

export const PHONE_STICKER_DESIGNS_EXTENDED = [
  { id: 'phone_11', label: 'Sapphire Prism', tags: [...PHONE_TAGS, 'sapphire', 'prism', 'blue', 'layered'], clinicTypes: ['dental', 'laser'], Component: PhoneSticker11 },
  { id: 'phone_12', label: 'Ember Wave', tags: [...PHONE_TAGS, 'ember', 'wave', 'orange', 'fire'], clinicTypes: ['laser'], Component: PhoneSticker12 },
  { id: 'phone_13', label: 'Arctic Frost', tags: [...PHONE_TAGS, 'arctic', 'frost', 'ice', 'blue', 'cool'], clinicTypes: ['dental', 'laser'], Component: PhoneSticker13 },
  { id: 'phone_14', label: 'Jade Dynasty', tags: [...PHONE_TAGS, 'jade', 'dynasty', 'emerald', 'green', 'gold'], clinicTypes: ['dental'], Component: PhoneSticker14 },
  { id: 'phone_15', label: 'Volcanic Pulse', tags: [...PHONE_TAGS, 'volcanic', 'pulse', 'red', 'glow', 'lava'], clinicTypes: ['laser'], Component: PhoneSticker15 },
  { id: 'phone_16', label: 'Amethyst Cloud', tags: [...PHONE_TAGS, 'amethyst', 'cloud', 'purple', 'pastel'], clinicTypes: ['beauty'], Component: PhoneSticker16 },
  { id: 'phone_17', label: 'Stellar Command', tags: [...PHONE_TAGS, 'stellar', 'command', 'dark', 'gold', 'space'], clinicTypes: ['laser'], Component: PhoneSticker17 },
  { id: 'phone_18', label: 'Crystal Pane', tags: [...PHONE_TAGS, 'crystal', 'pane', 'glass', 'transparent', 'modern'], clinicTypes: ['laser', 'beauty'], Component: PhoneSticker18 },
  { id: 'phone_19', label: 'Crimson Alert', tags: [...PHONE_TAGS, 'crimson', 'alert', 'red', 'bold', 'urgent'], clinicTypes: ['dental', 'laser'], Component: PhoneSticker19 },
  { id: 'phone_20', label: 'Pacific Crest', tags: [...PHONE_TAGS, 'pacific', 'crest', 'ocean', 'blue', 'sea'], clinicTypes: ['dental', 'beauty'], Component: PhoneSticker20 },
  { id: 'phone_21', label: 'Vintage Telegraph', tags: [...PHONE_TAGS, 'vintage', 'telegraph', 'retro', 'stamp', 'classic'], clinicTypes: ['beauty'], Component: PhoneSticker21 },
  { id: 'phone_22', label: 'Dental Premium', tags: [...PHONE_TAGS, 'dental', 'premium', 'mint', 'green', 'tooth'], clinicTypes: ['dental'], Component: PhoneSticker22 },
  { id: 'phone_23', label: 'Gunmetal Console', tags: [...PHONE_TAGS, 'gunmetal', 'console', 'terminal', 'dark', 'tech'], clinicTypes: ['laser'], Component: PhoneSticker23 },
  { id: 'phone_24', label: 'Sugar Rush', tags: [...PHONE_TAGS, 'sugar', 'rush', 'candy', 'pink', 'fun'], clinicTypes: ['beauty'], Component: PhoneSticker24 },
  { id: 'phone_25', label: 'Prismatic Frame', tags: [...PHONE_TAGS, 'prismatic', 'frame', 'rainbow', 'elegant'], clinicTypes: ['laser', 'beauty'], Component: PhoneSticker25 },
  { id: 'phone_26', label: 'Bronze Medal', tags: [...PHONE_TAGS, 'bronze', 'medal', 'copper', 'metallic', 'warm'], clinicTypes: ['dental'], Component: PhoneSticker26 },
  { id: 'phone_27', label: 'Cyber Pink', tags: [...PHONE_TAGS, 'cyber', 'pink', 'neon', 'glow', 'bright'], clinicTypes: ['laser', 'beauty'], Component: PhoneSticker27 },
  { id: 'phone_28', label: 'Swiss Minimal', tags: [...PHONE_TAGS, 'swiss', 'minimal', 'clean', 'white', 'simple'], clinicTypes: ['dental', 'beauty'], Component: PhoneSticker28 },
  { id: 'phone_29', label: 'Botanical Card', tags: [...PHONE_TAGS, 'botanical', 'card', 'forest', 'green', 'nature'], clinicTypes: ['beauty'], Component: PhoneSticker29 },
  { id: 'phone_30', label: 'Titanium Badge', tags: [...PHONE_TAGS, 'titanium', 'badge', 'steel', 'metallic', 'grey'], clinicTypes: ['dental', 'laser'], Component: PhoneSticker30 },
  { id: 'phone_31', label: 'Purple Majesty', tags: [...PHONE_TAGS, 'purple', 'majesty', 'royal', 'luxury', 'elegant'], clinicTypes: ['beauty'], Component: PhoneSticker31 },
  { id: 'phone_32', label: 'Rose Petal', tags: [...PHONE_TAGS, 'rose', 'petal', 'blush', 'pink', 'soft'], clinicTypes: ['beauty'], Component: PhoneSticker32 },
  { id: 'phone_33', label: 'Plasma Bolt', tags: [...PHONE_TAGS, 'plasma', 'bolt', 'electric', 'cyan', 'neon'], clinicTypes: ['laser'], Component: PhoneSticker33 },
  { id: 'phone_34', label: 'Desert Sunrise', tags: [...PHONE_TAGS, 'desert', 'sunrise', 'warm', 'sand', 'gold'], clinicTypes: ['dental', 'beauty'], Component: PhoneSticker34 },
  { id: 'phone_35', label: 'Terminal Pro', tags: [...PHONE_TAGS, 'terminal', 'pro', 'charcoal', 'mono', 'hacker'], clinicTypes: ['laser'], Component: PhoneSticker35 },
  { id: 'phone_36', label: 'Deep Sea Pearl', tags: [...PHONE_TAGS, 'deep', 'sea', 'pearl', 'aqua', 'circle'], clinicTypes: ['dental', 'beauty'], Component: PhoneSticker36 },
  { id: 'phone_37', label: 'Bordeaux Signature', tags: [...PHONE_TAGS, 'bordeaux', 'signature', 'wine', 'velvet', 'luxury'], clinicTypes: ['dental', 'beauty'], Component: PhoneSticker37 },
  { id: 'phone_38', label: 'Cloud Nine', tags: [...PHONE_TAGS, 'cloud', 'nine', 'sky', 'blue', 'light'], clinicTypes: ['beauty'], Component: PhoneSticker38 },
  { id: 'phone_39', label: 'Void Echo', tags: [...PHONE_TAGS, 'void', 'echo', 'obsidian', 'dark', 'sleek'], clinicTypes: ['laser'], Component: PhoneSticker39 },
  { id: 'phone_40', label: 'Imperial Seal', tags: [...PHONE_TAGS, 'imperial', 'seal', 'gold', 'crest', 'premium'], clinicTypes: ['dental'], Component: PhoneSticker40 },
];

const x = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
