import React from 'react';

const SVG = ({
  defaultColors = {},
  color = 'blue',
  width = 99,
  height = 78
}) => {
  // Correct color when is passed null
  color = !color ? 'blue' : color;
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      width="105.4px"
      x="0px" y="0px"
      height="74.92px"
      style={{ overflow: 'visible' }}
      viewBox="0 0 105.4 74.92">
      <defs>
        <linearGradient id="folder-blue-a" x1="50 % " x2="50 % " y1="2.892 % " y2="100 % ">
          < stop offset="0%" stopColor="#B3D1FF" />
          <stop offset="100%" stopColor="#87B7FF" />
        </linearGradient >
        <linearGradient id="folder-green-a" x1="50%" x2="50%" y1="2.892%" y2="100%">
          <stop offset="0%" stopColor="#BDDB93" />
          <stop offset="100%" stopColor="#7EC45A" />
        </linearGradient>
        <linearGradient id="folder-grey-a" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#D4D4D4" />
          <stop offset="100%" stopColor="#BABABA" />
        </linearGradient>
        <linearGradient id="folder-pink-a" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB3DB" />
          <stop offset="100%" stopColor="#FF87C7" />
        </linearGradient>
        <linearGradient id="folder-purple-a" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#DDB3FF" />
          <stop offset="100%" stopColor="#C680FF" />
        </linearGradient>
        <linearGradient id="folder-red-a" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB3B3" />
          <stop offset="100%" stopColor="#FF8787" />
        </linearGradient>
        <linearGradient id="folder-yellow-a" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE3B3" />
          <stop offset="100%" stopColor="#FFCE7A" />
        </linearGradient>
      </defs >
      <rect fill={`url(#folder-${color}-a)`} className="st0" x="4.34" y="15.05" width="88.46" height="57.42"></rect>
      <rect fill={`url(#folder-${color}-a)`} className="st1" x="8.42" y="20.31" width="88.57" height="52.16"></rect>;
      <path
        className=" "
        fill={`url(#folder-${color}-a)`}
        fillRule="evenodd"
        d="M105.4,26.96v41.31c0,0-0.23,6.65-8.39,6.65H9.12c0,0-9.1,0.35-9.1-6.65V6.65c0,0-0.7-6.65,6.65-6.65 s12.95,0,12.95,0s5.34-0.05,9.8,1.75c5.04,2.39,9.1,4.67,9.1,4.67S44.71,9.8,49.26,9.8h34.89v5.25H4.34v52.51 c0,0-0.09,4.96,5.37,3.97c4.49-0.82,4.2-5.02,4.2-5.02V26.84L105.4,26.96z"
      />
    </svg >
  );
};

export default SVG;