declare module 'swagger-jsdoc' {
  const swaggerJsdoc: (options: any) => Record<string, any>;
  export default swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  const serve: any[];
  const setup: (spec: any, options?: any) => (req: any, res: any, next: any) => void;
  export { serve, setup };
  export default { serve, setup };
}
