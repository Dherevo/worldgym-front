// globals.d.ts

// Extend the Window interface
interface Window {
    promise: (action: (resolve: Function, reject?: Function) => void) => ( () => Promise<any> ); 
  }
  
  // Declare the global function
  declare const promise: (action: (resolve: Function, reject?: Function) => void) => ( () => Promise<any> );
  