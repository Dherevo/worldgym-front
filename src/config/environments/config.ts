import { IAppConfig } from "lib";

const config : IAppConfig = {
    
    title: import.meta.env._TITLE,

    disableSvgIconsCache: false,

    api: {
        url: import.meta.env._API_URL,
        documentation: ''
    }
}
export default config;
