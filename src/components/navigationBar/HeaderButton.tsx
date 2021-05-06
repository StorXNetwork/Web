import * as React from 'react';
import { Link } from 'react-router-dom';
// import './HeaderButton.scss';

interface HeaderButtonProps {
  icon: string;
  name: string;
  // to: string;
  active?: string;
  clickHandler?: any;
}

const HeaderButton = (props: HeaderButtonProps) => {

  return (
    <li className={props.active}>
      <Link onClick={props.clickHandler}>
        <i className={props.icon}></i><span>{props.name}</span>
      </Link>
    </li>
  );


  // return (
  //   <div className="HeaderButton" onClick={props.clickHandler} style={{
  //     backgroundImage: `url(${props.icon})`,
  //     backgroundRepeat: 'no-repeat',
  //     backgroundPosition: 'center'
  //   }}>
  //   </div>
  // );
};

export default HeaderButton;