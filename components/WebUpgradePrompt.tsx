/**
 * WebUpgradePrompt — Subtle post-game monetisation for web
 * Shows after results screen. Not a hard gate — just a well-timed ask.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { type Package } from '@revenuecat/purchases-js';
import { getWebOfferings, purchaseWebPackage, checkWebProStatus } from '../lib/purchases.web';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function WebUpgradePrompt({ onClose, onSuccess }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    getWebOfferings().then((pkgs) => {
      if (pkgs.length === 0) setNoKey(true);
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async (pkg: Package) => {
    setPurchasing(true);
    const success = await purchaseWebPackage(pkg);
    setPurchasing(false);
    if (success) onSuccess();
  };

  // Format price from RevenueCat package
  const formatPrice = (pkg: Package) => {
    try {
      return pkg.rcBillingProduct.currentPrice.formattedPrice;
    } catch {
      return '$2.99';
    }
  };

  const formatPeriod = (pkg: Package) => {
    try {
      const period = pkg.rcBillingProduct.normalPeriodDuration;
      if (!period) return 'one-time';
      if (period.includes('M')) return '/month';
      if (period.includes('Y')) return '/year';
      return 'one-time';
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <Text style={styles.emoji}>🎲</Text>
        <Text style={styles.title}>Enjoyed the chaos?</Text>
        <Text style={styles.sub}>
          Unlock 300+ premium prompts — spicier, wilder, and exclusive to Gambit Pro.
        </Text>

        <View style={styles.perks}>
          {['300+ premium prompts', 'Chaos & Spicy packs', 'New packs added monthly'].map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#8B5CF6" style={{ marginTop: 24 }} />
        ) : noKey ? (
          // Fallback if no RC key set — Ko-fi link
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open('https://ko-fi.com/maxwellyoung', '_blank');
              }
              onClose();
            }}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.btnGradient}>
              <Text style={styles.btnText}>Support Gambit ☕</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          packages.slice(0, 2).map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={styles.primaryBtn}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.btnGradient}>
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>
                    Unlock Pro — {formatPrice(pkg)}{formatPeriod(pkg)}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  perks: { width: '100%', gap: 10, marginBottom: 28 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', marginBottom: 10 },
  btnGradient: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: { marginTop: 4 },
  skipText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
});
