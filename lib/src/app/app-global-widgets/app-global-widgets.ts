import { defineComponent } from 'vue';
import Drawer from '../drawer/drawer.vue';
import AppModal from '../app-modal/app-modal.vue';
import AppNotifications from '../app-notifications/app-notifications.vue';
import PackageState from '../../modules/PackageState';
import CookieConsent from '../cookie-consent/cookie-consent.vue';

export default defineComponent({
  components: { Drawer, AppModal, AppNotifications, CookieConsent },

  mounted() {
    PackageState.set('globalWidgets', {
      drawer: this.$refs.appDrawer,
      notifications: this.$refs.appNotifications,
      modal: this.$refs.appModal,
      cookieConsent: this.$refs.cookieConsent
    });
  }

});