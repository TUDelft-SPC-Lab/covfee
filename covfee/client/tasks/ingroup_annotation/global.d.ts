/* remove error of not seeing CSS module imports*/ 
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
