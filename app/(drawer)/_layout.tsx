import { CustomDrawerContent } from '@/components/drawer/CustomDrawerContent';
import { drawerScreenOptions } from '@/lib/navigation/DrawerNavigator';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      initialRouteName="home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={drawerScreenOptions}
    />
  );
}
