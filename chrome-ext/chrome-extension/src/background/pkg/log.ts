const isProd = process.env.NODE_ENV === 'production';
const log = (message: string, ...args: any[]) => {
  if (!isProd) {
    console.log(message, ...args);
  }
};

export { log };
