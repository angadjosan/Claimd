import React from 'react';
import MinimalNavbar from '../../components/MinimalNavbar';
import UserDash from '../../components/UserDash';

const UserPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <UserDash />
    </div>
  );
};

export default UserPage;
