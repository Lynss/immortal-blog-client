const API_SERVER = '//localhost:8083/api';
const SERVER = '//localhost:8083';

const SUCCESS = 200;
const UNKNOWN_ERROR = 500;

const Immortal = {
    Success: {
        code: SUCCESS,
        message: 'Request successfully',
    },
    UnknownError: {
        code: UNKNOWN_ERROR,
        message: 'Unknown internal server error',
    },
};

const METHOD = {
    get: 'get',
    post: 'post',
    put: 'put',
    delete: 'delete',
};

const DEFAULT_FORBIDDEN = ['untouchable'];

const ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const API_PATH = {
    login: '/login',
    register: '/register',
    tags: '/tags',
    users: '/users',
    user_settings: '/users/settings',
    users_activated: '/users/activated',
    role_options: '/roles/options',
    author_options: '/users/options',
    category_options: '/categories/options',
    tag_options: '/tags/options',
    categories: '/categories',
    blogs: '/blogs',
};

export {
    API_SERVER,
    SERVER,
    SUCCESS,
    Immortal,
    METHOD,
    ISO_FORMAT,
    DEFAULT_FORBIDDEN,
    API_PATH,
};
