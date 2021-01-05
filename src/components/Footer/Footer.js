import * as React from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import styles from "./Footer.module.scss";

import { withTranslations } from '../../services/Translations/Translations';

class Footer extends React.Component {

  render() {
    return (
      <div className={styles.Footer}>
        <div className={styles.content}>
          <div className={styles.copyright}>
            © DeFi Money Market Foundation 2020
          </div>
          <div className={styles.contractAddress}>
            <a href={'https://www.etherscan.com/address/' + process.env.REACT_APP_DMM_CONTROLLER} target={'_blank'} rel='noopener noreferrer'>
              { this.props.excerpt('footer.smartContract', this.props.language) }
            </a>
          </div>
          <div className={styles.socialWrapper}>
            <a href={'https://twitter.com/DmmDAO'} target={'_blank'} rel='noopener noreferrer'>
              <FontAwesomeIcon icon={['fab', 'twitter']}/>
            </a>
            <a href={'https://www.reddit.com/r/DMMDAO/'} target={'_blank'} rel='noopener noreferrer'>
              <FontAwesomeIcon icon={['fab', 'reddit']}/>
            </a>
            <a href={'https://medium.com/dmm-dao'} target={'_blank'} rel='noopener noreferrer'>
              <FontAwesomeIcon icon={['fab', 'medium']}/>
            </a>
            <a href={'https://discord.gg/9dM8yaA'} target={'_blank'} rel='noopener noreferrer'>
              <FontAwesomeIcon icon={['fab', 'discord']}/>
            </a>
          </div>
        </div>
      </div>
    );
  };
}

export default withTranslations(Footer);