import { CustomDrawerContent } from '@/shared/drawer/CustomDrawerContent';
import { drawerScreenOptions } from '@/lib/navigation/DrawerNavigator';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
    return (<Drawer initialRouteName="homeDashboardScreen" drawerContent={(props) => <CustomDrawerContent {...props}/>} screenOptions={drawerScreenOptions}/>);
}
