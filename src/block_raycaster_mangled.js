// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0 (the "License").

{
  let U={
      directionType:1,
      maxDistance:6,
      startOffset:0,
      cellSize:1
    },
    X,
    Y,
    Z,
    C,
    cast;
  {
    let P=3.141592653589793,
      T=6.283185307179586,
      R=0.017453292519943295,
      G=57.29577951308232;
    C={
      get 11(){
        let v=1/Math.sqrt(X*X+Y*Y+Z*Z);
        X*=v;
        Y*=v;
        Z*=v
      },
      get 12(){
        Y=Math.atan2(Y,Math.sqrt(X*X+Z*Z));
        X=Math.atan2(-X,-Z)
      },
      get 13(){
        Y=Math.atan2(Y,Math.sqrt(X*X+Z*Z))*G;
        X=Math.atan2(-X,-Z)*G
      },
      get 21(){
        X=(X+P)%T;
        if(X<0){X+=T}
        X=X-P;
        let y=Math.cos(X),
          p=Math.cos(Y);
        X=-p*Math.sin(X);
        Y=Math.sin(Y);
        Z=-p*y
      },
      get 22(){
        X=(X+P)%T;
        if(X<0){X+=T}
        X=X-P
      },
      get 23(){
        X=(X+P)%T;
        if(X<0){X+=T}
        X=X-P;
        X*=G;
        Y*=G
      },
      get 31(){
        X=(X+180)%360;
        if(X<0){X+=360}
        X-=180;
        X*=R;
        Y*=R;
        let y=Math.cos(X),
          p=Math.cos(Y);
        X=-p*Math.sin(X);
        Y=Math.sin(Y);
        Z=-p*y
      },
      get 32(){
        X=(X+180)%360;
        if(X<0){X+=360}
        X-=180;
        X*=R;
        Y*=R
      },
      get 33(){
        X=(X+180)%360;
        if(X<0){X+=360}
        X-=180
      }
    }
  }
  {
    let F=1e9,
      a=0,
      b=0,
      c=0,
      d=0,
      e=0,
      f=0,
      g=0,
      h=0,
      i=0,
      j=0,
      k=0,
      l=0,
      m=0,
      n=0,
      o=0,
      p=0,
      q=0,
      r=0,
      s=0,
      t=0,
      u=0,
      v=0,
      w=0;
    cast=(P,D,T,M,O,L,I)=>{
      a>>=I===true;
      b-=c;
      if(a===0){
        X=D[0];
        Y=D[1];
        Z=D[2];
        let A=T|0;
        if(A<1|A>3){
          A=U.directionType
        }
        C[A+"1"];
        d=X;
        e=Y;
        f=Z;
        let B=M;
        if(!(B>0)){
          B=U.maxDistance
        }
        let E=O;
        if(E===undefined|E===null){
          E=U.startOffset
        }
        let G=L;
        if(!(G>0)){
          G=U.cellSize
        }
        g=E;
        h=P[0]+d*E;
        i=P[1]+e*E;
        j=P[2]+f*E;
        k=(d>0)-(d<0);
        l=(e>0)-(e<0);
        m=(f>0)-(f<0);
        let H=d*k,
          J=e*l,
          K=f*m,
          N=+(H===0),
          Q=+(J===0),
          R=+(K===0);
        n=G/(H+N);
        o=G/(J+Q);
        p=G/(K+R);
        q=Math.floor(h/G);
        r=Math.floor(i/G);
        s=Math.floor(j/G);
        if(N){t=F}else{t=((q+(k+1>>1))*G-h)/d}
        if(Q){u=F}else{u=((r+(l+1>>1))*G-i)/e}
        if(R){v=F}else{v=((s+(m+1>>1))*G-j)/f}
        let S=G*1e-9;
        if(t===0){t+=S}
        if(u===0){u+=S}
        if(v===0){v+=S}
        w=B+S;
        b=0;
        a=1
      }
      if(a===1){
        c=1;
        let A=k,
          B=l,
          E=m,
          G=n,
          H=o,
          J=p,
          K=q,
          N=r,
          Q=s,
          R=t,
          S=u,
          V=v,
          W=w,
          x,
          y,
          z,
          $,
          _,
          __;
        do{
          b++;
          q=K;
          r=N;
          s=Q;
          t=R;
          u=S;
          v=V;
          x=R<S&R<V;
          y=S<=V&1-x;
          z=1-x-y;
          $=R*x+S*y+V*z;
          K+=A*x;
          N+=B*y;
          Q+=E*z;
          R+=G*x;
          S+=H*y;
          V+=J*z;
          _=api.getBlockId(K,N,Q);
          __=$<=W
        }while(!_&__);
        let _x=-A*x,
          _y=-B*y,
          _z=-E*z;
        c=0;
        a=0;
        return{
          blockId:_,
          position:[K,N,Q],
          normal:[_x,_y,_z],
          adjacent:[K+_x,N+_y,Q+_z],
          point:[
            h+d*$,
            i+e*$,
            j+f*$
          ],
          distance:$+g,
          offsetDistance:$,
          steps:b,
          inRange:__
        }
      }
    }
  }
  let offsetPosition=(P,D,T,O)=>{
    let f=T|0;
    if(f<1|f>3){
      f=U.directionType
    }
    X=D[0];
    Y=D[1];
    Z=D[2];
    C[f+"1"];
    let o=O;
    if(o===undefined|o===null){
      o=U.startOffset
    }
    return[
      P[0]+X*o,
      P[1]+Y*o,
      P[2]+Z*o
    ]
  };
  let maxDistancePosition=(P,D,T,M,O)=>{
    let f=T|0;
    if(f<1|f>3){
      f=U.directionType
    }
    X=D[0];
    Y=D[1];
    Z=D[2];
    C[f+"1"];
    let m=M;
    if(!(m>0)){
      m=U.maxDistance
    }
    let o=O;
    if(o===undefined|o===null){
      o=U.startOffset
    }
    let t=m+o;
    return[
      P[0]+X*t,
      P[1]+Y*t,
      P[2]+Z*t
    ]
  };
  let convertDirection=(R,I,O)=>{
    let i=I|0;
    if(i<1|i>3){
      i=U.directionType
    }
    let o=O|0;
    if(o<1|o>3){
      o=U.directionType
    }
    X=R[0];
    Y=R[1];
    Z=R[2];
    C[""+i+o];
    if(o===1){
      return[X,Y,Z]
    }else{
      return[X,Y]
    }
  };
  globalThis.BR=Object.seal({
    default:U,
    cast,
    convertDirection,
    offsetPosition,
    maxDistancePosition
  });
  void 0
}

