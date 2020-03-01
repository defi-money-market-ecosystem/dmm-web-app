import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from "./Footer.module.scss";

class Footer extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div className={styles.Footer}>
        <div className={styles.content}>
          <div className={styles.copyright}>
            © DeFi Money Market Foundation 2020
          </div>
          <div className={styles.contractAddress}>
            <a href={'https://www.etherscan.com/'+process.env.REACT_APP_DMM_CONTROLLER}>{process.env.REACT_APP_DMM_CONTROLLER}</a>
          </div>
          <div className={styles.socialWrapper}>
            <a href={'https://twitter.com/DmmFoundation'} target={'_blank'}><FontAwesomeIcon icon={['fab', 'twitter']} /></a>
            <a href={'https://www.reddit.com/r/DMMDAO/'} target={'_blank'}><FontAwesomeIcon icon={['fab', 'reddit']} /></a>
            <a href={'https://medium.com/dmm-dao'} target={'_blank'}><FontAwesomeIcon icon={['fab', 'medium']} /></a>
            <a href={'https://discord.gg/9dM8yaA'} target={'_blank'}><FontAwesomeIcon icon={['fab', 'telegram']} /></a>
          </div>
        </div>
      </div>
    );
  };
}

export default Footer;