import React from 'react';

import styles from './TopSection.scss';

class TopSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.TopBar}>
        <div className={styles.content}>
          tesst
        </div>
      </div>
    );
  }
}

export default TopSection;
