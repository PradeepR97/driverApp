import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppToast } from "@/shared/ui/AppToast";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { RatingComponent } from "@/shared/ui/RatingComponent";
import { ReasonList } from "@/shared/ui/ReasonList";
import { Colors, Spacing } from "@/config/theme";
import { ratingStyles } from "./rating.styles";
import { useRating } from "./useRating";
export default function RatingScreen() {
    const insets = useSafeAreaInsets();
    const { trip, t, name, stars, setStars, selected, toggle, comment, setComment, busy, reasonsLoading, ratingReasons, reasonHeading, error, setError, starsError, setStarsError, shakeStyle, complete, successToast, checkScale, shouldShowReasons, submit, onToastDismiss, } = useRating();
    if (!trip)
        return null;
    return (<View style={[ratingStyles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView contentContainerStyle={ratingStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={ratingStyles.avatar}>
          <Ionicons name="person" size={40} color={Colors.primaryDark}/>
        </View>
        <Text style={ratingStyles.title}>{t("rating.title")}</Text>
        <Text style={ratingStyles.sub}>{t("rating.subtitle", { name })}</Text>

        <Animated.View style={[
            shakeStyle,
            ratingStyles.starsWrap,
            starsError ? ratingStyles.starsWrapError : null,
        ]}>
          <RatingComponent value={stars} onChange={(value) => {
            setStars(value);
            setStarsError(false);
            setError(null);
        }} disabled={complete || busy}/>
        </Animated.View>

        {shouldShowReasons ? (<>
            <Text style={ratingStyles.tagLabel}>{reasonHeading}</Text>
            {reasonsLoading ? (<Text style={ratingStyles.loadText}>Loading reasons...</Text>) : (<ReasonList options={ratingReasons} selectedCodes={selected} onToggle={toggle} multi mode="chips"/>)}
            <TextInput value={comment} onChangeText={(value) => setComment(value.slice(0, 1000))} editable={!complete && !busy} placeholder="Add comment (optional)" placeholderTextColor={Colors.textMuted} multiline maxLength={1000} style={ratingStyles.commentInput}/>
            <Text style={ratingStyles.commentCount}>{comment.length}/1000</Text>
          </>) : null}
        <FormErrorText error={error}/>
      </ScrollView>

      <View style={[ratingStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title={t("rating.submit")} onPress={() => void submit()} disabled={complete || busy} loading={busy}/>
      </View>

      {complete ? (<View style={ratingStyles.celebrateOverlay} pointerEvents="none">
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark-circle" size={96} color={Colors.primary}/>
          </Animated.View>
        </View>) : null}

      <AppToast visible={successToast} message="Rating submitted successfully" variant="success" onDismiss={onToastDismiss}/>
    </View>);
}
