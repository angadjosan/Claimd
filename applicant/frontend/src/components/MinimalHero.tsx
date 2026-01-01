import { Link } from 'react-router-dom';
import DisabilityGlobe from './DisabilityGlobe';

export default function MinimalHero() {
  return (
    <div className="relative z-10">
      {/* 3D Globe Hero with Claimd logo and CTA */}
      <DisabilityGlobe />
    </div>
  );
}

