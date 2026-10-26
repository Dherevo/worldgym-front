import http from './src/modules/http/http';
import HttpRequest from './src/modules/http/request';
import HttpError from './src/modules/http/error';
import translate from './src/modules/translator';
import Utils from './src/modules/utils';
import Config from './src/modules/config';
import App from './src/modules/app';
import { Storage } from './src/modules/storage';
import Time, { TimeInterval} from './src/modules/time';
import EventListener from './src/modules/event-listener';
import Validator from './src/modules/validator';
import { Store } from './src/modules/store';
import Table from './src/widgets/app-table/table';
import PaginatorStructure from './src/widgets/app-table/paginator-structure';
import HeadManager from './src/modules/head-manager';
import Model from './src/modules/model';
import type IOption from './src/interfaces/IOption';
import type IAppConfig from './src/interfaces/IAppConfig';
import type IRoutes from './src/interfaces/IRoutes';
import AppPage from './src/app/app-page/app-page.vue';
import CircleImage from './src/widgets/circle-image/circle-image.vue';
import Loader from './src/widgets/loader/loader.vue';
import Btn from './src/widgets/btn/btn.vue';
import FormInput from './src/widgets/form-input/form-input.vue';
import VideoPlayer from './src/widgets/video-player/video-player.vue';
import InfiniteScroll from './src/widgets/infinite-scroll/infinite-scroll.vue';
import FilePicker from './src/widgets/file-picker/file-picker.vue';
import ImageLoad from './src/widgets/image-load/image-load.vue';
import CloseX from './src/widgets/closex/closex.vue';
import Back from './src/widgets/back/back.vue';
import Burger from './src/widgets/burger/burger.vue';
import EventCalendar from './src/widgets/event-calendar/event-calendar.vue';
import Checkbox from './src/widgets/checkbox/checkbox.vue';
import TextImage from './src/widgets/textimage/textimage.vue';
import VideoBackground from './src/widgets/video-background/video-background.vue';
import SocialShare from './src/widgets/social-share/social-share.vue';
import Ripple from './src/widgets/ripple/ripple.vue';
import AppTable from './src/widgets/app-table/app-table.vue';
import Drawer from './src/app/drawer/drawer.vue';
import AppNotifications from './src/app/app-notifications/app-notifications.vue';
import AppModal from './src/app/app-modal/app-modal.vue';
import AppGlobalWidgets from './src/app/app-global-widgets/app-global-widgets.vue';
import CookieConsent from './src/app/cookie-consent/cookie-consent.vue';
import Popup from './src/widgets/popup/popup.vue';
import Avatar from './src/widgets/avatar/avatar.vue';
import LoginPageV1 from "./src/templates/login-page-v1/login-page-v1.vue";
import LoginPageV2 from "./src/templates/login-page-v2/login-page-v2.vue";
import BackofficeLayout from "./src/templates/backoffice-layout/backoffice-layout.vue";
import AnimatedNumber from './src/widgets/animated-number/animated-number.vue';
import BooleanIcon from './src/widgets/boolean-icon/boolean-icon.vue';
import MirrorScroll from './src/widgets/mirror-scroll/mirror-scroll.vue';
import Link from './src/widgets/link/link.vue';
import Tooltip from './src/widgets/tooltip/tooltip.vue';

//// Global functions
(window as any).promise = (action: (resolve: (arg?: any) => void, reject: (err?: any) => void) => void) => () => new Promise(action)
////////

const $t = translate.get;

export {
    Utils,
    translate,
    $t,
    http,
    Config,
    App,
    Storage,
    Time,
    TimeInterval,
    EventListener,
    Validator,
    Store,
    HeadManager,
    Model,

    // Types
    HttpError,
    HttpRequest,
    IOption,
    IAppConfig,
    IRoutes,
    Table,
    PaginatorStructure,

    // Widgets
    AppTable,
    CircleImage,
    Loader,
    Btn,
    FormInput,
    Drawer,
    AppNotifications,
    AppModal,
    VideoPlayer,
    InfiniteScroll,
    FilePicker,
    ImageLoad,
    CloseX,
    Back,
    AppGlobalWidgets,
    Burger,
    Checkbox,
    EventCalendar,
    SocialShare,
    AppPage,
    Ripple,
    TextImage,
    VideoBackground,
    CookieConsent,
    Popup,
    Avatar,
    AnimatedNumber,
    BooleanIcon,
    MirrorScroll,
    Link,
    Tooltip,
    
    // Templates
    LoginPageV1,
    LoginPageV2,
    BackofficeLayout
}