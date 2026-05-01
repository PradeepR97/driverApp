import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Spacing } from "@/config/theme";
import { indexStyles } from "./index.styles";
import { useIndex } from "./useIndex";
export default function LanguageScreen() {
    const insets = useSafeAreaInsets();
    const { t, selected, setSelected, selection, heroOpacity, heroScale, shake, onContinue, languages, } = useIndex();
    return (<View style={[indexStyles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <Animated.View style={[
            indexStyles.hero,
            { opacity: heroOpacity, transform: [{ scale: heroScale }] },
        ]}>
        <View style={indexStyles.globeWrap}>
          <Ionicons name="globe-outline" size={36} color={Colors.white}/>
        </View>
        <Text style={indexStyles.title}>{t("language.title")}</Text>
        <Text style={indexStyles.subtitle}>{t("language.subtitle")}</Text>
      </Animated.View>

      <Animated.View style={shake.style}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={indexStyles.grid} showsVerticalScrollIndicator={false}>
          {languages.map((lang, index) => {
            const active = selected === index;
            return (<Pressable key={`${lang.code}-${"nameKey" in lang ? lang.nameKey : lang.en}`} onPress={() => {
                    setSelected((prev) => {
                        const next = prev === index ? null : index;
                        if (next != null) {
                            if (selection.error)
                                selection.clearError();
                            shake.reset();
                        }
                        return next;
                    });
                }} style={({ pressed }) => [
                    indexStyles.card,
                    active && indexStyles.cardActive,
                    pressed && indexStyles.cardPressed,
                ]}>
                <Text style={indexStyles.cardCode}>{lang.code}</Text>
                <Text style={indexStyles.cardEn}>
                  {"nameKey" in lang ? t(lang.nameKey) : lang.en}
                </Text>
                <Text style={indexStyles.cardNative}>{lang.native}</Text>
              </Pressable>);
        })}

          <View style={indexStyles.languageError}>
            <FormErrorText error={selection.error}/>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={indexStyles.spacer}/>
      <Text style={indexStyles.region}>{t("language.region")}</Text>
      <View style={[indexStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title={t("common.continue")} onPress={onContinue}/>
      </View>
    </View>);
}
