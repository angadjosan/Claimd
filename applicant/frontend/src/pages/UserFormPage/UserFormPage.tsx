import React from 'react';
import MinimalNavbar from '../../components/MinimalNavbar';
import MultiStepForm from '../../components/MultiStepForm';

const UserFormPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <main className="py-16 pt-32">
        <MultiStepForm />
      </main>
    </div>
  );
};

export default UserFormPage;
