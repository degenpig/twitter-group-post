import React from "react";
import Tweet from 'react-tweet'

const CustomTweet = ({tweet}) => {
  const linkProps = {target: '_blank', rel: 'noreferrer', is_https: true};
  return <Tweet data={tweet} linkProps={linkProps} />;
};

export default CustomTweet;