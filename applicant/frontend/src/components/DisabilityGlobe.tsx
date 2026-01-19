import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FileData {
  id: number;
  title: string;
  status: string;
  date: string;
}

const generateFiles = (): FileData[] => {
  const conditions = [
    'Chronic Pain Syndrome',
    'Degenerative Disc Disease', 
    'Multiple Sclerosis',
    'Rheumatoid Arthritis',
    'Heart Disease',
    'Diabetes Complications',
    'Depression & Anxiety',
    'COPD',
    'Lupus'
  ];
  
  const statuses = ['Under Review', 'Evaluation Phase', 'Additional Evidence', 
                     'Decision Pending', 'Processing', 'In Appeals'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: conditions[i % conditions.length] || `Condition #${i + 1}`,
    status: statuses[i % statuses.length] || 'Pending',
    date: `${new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }));
};

interface FloatingCardProps {
  position: [number, number, number];
  file: FileData;
  onClick: (id: number) => void;
  isHovered: boolean;
}

function FloatingCard({ position, file, onClick, isHovered }: FloatingCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Random initial velocity for each card
  const velocity = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 0.03,
    (Math.random() - 0.5) * 0.04,
    (Math.random() - 0.5) * 0.02
  ));
  
  // Random rotation speeds
  const rotationVelocity = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 0.08,
    (Math.random() - 0.5) * 0.1,
    (Math.random() - 0.5) * 0.06
  ));
  
  // Boundary limits - wider to allow papers to spread to edges
  const boundary = 7;
  const timeOffset = useRef(Math.random() * 100);
  
  // Paper bending/wind forces
  const windBend = useRef({
    x: Math.random() * 0.1,
    y: Math.random() * 0.1,
    z: Math.random() * 0.05
  });

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Add wind turbulence for fluttering effect
      const time = state.clock.elapsedTime + timeOffset.current;
      const windX = Math.sin(time * 1.5 + file.id) * 0.03;
      const windY = Math.cos(time * 1.2 + file.id * 1.3) * 0.03;
      const windZ = Math.sin(time * 1.3 + file.id * 0.7) * 0.02;
      
      // Update position with wind
      meshRef.current.position.add(velocity.current.clone().multiplyScalar(delta * 45));
      meshRef.current.position.x += windX * delta * 45;
      meshRef.current.position.y += windY * delta * 45;
      meshRef.current.position.z += windZ * delta * 45;
      
      // Apply bending forces from wind
      windBend.current.x = Math.sin(time * 2 + file.id * 0.7) * 0.08;
      windBend.current.y = Math.cos(time * 1.8 + file.id * 1.1) * 0.06;
      windBend.current.z = Math.sin(time * 2.3 + file.id * 0.9) * 0.05;
      
      // Fluttering rotation - paper tumbling in wind with bending
      meshRef.current.rotation.x = windBend.current.x + rotationVelocity.current.x * time * 0.3 + Math.sin(time * 3 + file.id) * 0.06;
      meshRef.current.rotation.y = rotationVelocity.current.y * time * 0.8 + Math.cos(time * 2 + file.id * 1.3) * 0.08;
      meshRef.current.rotation.z = windBend.current.y + rotationVelocity.current.z * time * 0.9 + Math.sin(time * 3.2 + file.id * 0.8) * 0.05;
      
      // Bounce off boundaries
      if (meshRef.current.position.x > boundary) {
        velocity.current.x = -Math.abs(velocity.current.x);
        meshRef.current.position.x = boundary;
      }
      if (meshRef.current.position.x < -boundary) {
        velocity.current.x = Math.abs(velocity.current.x);
        meshRef.current.position.x = -boundary;
      }
      if (meshRef.current.position.y > boundary) {
        velocity.current.y = -Math.abs(velocity.current.y);
        meshRef.current.position.y = boundary;
      }
      if (meshRef.current.position.y < -boundary) {
        velocity.current.y = Math.abs(velocity.current.y);
        meshRef.current.position.y = -boundary;
      }
      if (meshRef.current.position.z > boundary * 0.6) {
        velocity.current.z = -Math.abs(velocity.current.z);
        meshRef.current.position.z = boundary * 0.6;
      }
      if (meshRef.current.position.z < -boundary * 0.6) {
        velocity.current.z = Math.abs(velocity.current.z);
        meshRef.current.position.z = -boundary * 0.6;
      }
      
      // Scale effect on hover
      const targetScale = isHovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <>
      {/* Bending paper effect - using curved plane */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={() => onClick(file.id)}
      >
        <planeGeometry args={[0.8, 1.0, 4, 5]} />
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.0}
          roughness={0.05}
          envMapIntensity={2.0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
    </>
  );
}

function FloatingCards({ 
  onFileSelect
}: { 
  onFileSelect: (id: number) => void;
}) {
  const files = generateFiles();

  // Create random positions scattered across the screen - MORE spread to edges
  const generateRandomPositions = (count: number): [number, number, number][] => {
    return Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 12,  // Increased from 7 to 12 for wider spread
      (Math.random() - 0.5) * 12,  // Increased from 7 to 12 for wider spread
      (Math.random() - 0.5) * 4     // Increased from 3 to 4 for more depth
    ]);
  };
  
  const positions = generateRandomPositions(50);

  return (
    <>
      {/* Lights - enhanced for glossy sheen */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 10]} intensity={2.0} />
      <directionalLight position={[-10, -10, 10]} intensity={1.5} />
      <directionalLight position={[0, 10, 0]} intensity={1.2} />
      <pointLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={0.8} color="#ffffff" />
      
      {/* Cards - floating freely */}
      {positions.map((pos, index) => {
        const file = files[index];
        if (!file) return null;
        
        return (
          <FloatingCard
            key={file.id}
            position={pos}
            file={file}
            onClick={onFileSelect}
            isHovered={false}
          />
        );
      })}

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh 
          key={i}
          position={[
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 3
          ]}
        >
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#60a5fa" 
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </>
  );
}

function Modal({ file, onClose }: { file: FileData | null; onClose: () => void }) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Case #{file.id}</h2>
                <p className="text-sm text-white/90">{file.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="text-lg font-semibold text-blue-700">{file.status}</div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Date</div>
              <div className="text-lg font-semibold text-cyan-700">{file.date}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              This case represents a real disability appeal file in the processing system. 
              Our AI-powered platform helps streamline the review process, reducing wait times 
              from months to days.
            </p>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisabilityGlobe() {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const selectedFile = selectedFileId 
    ? (generateFiles().find(f => f.id === selectedFileId) || null)
    : null;

  return (
    <div ref={sectionRef} className="relative w-full h-screen overflow-hidden bg-transparent">
      {/* 3D Canvas - FIXED behind everything */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} style={{ pointerEvents: 'none', background: 'transparent' }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
        <Suspense fallback={
          <Html center>
            <div className="text-white">Loading...</div>
          </Html>
        }>
          <FloatingCards 
            onFileSelect={setSelectedFileId}
          />
        </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay - positioned in hero section */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* "Claimd" text ON TOP of the animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 
              className="text-8xl md:text-9xl font-light italic mb-8"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundImage: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: 'serif'
              }}
            >
              Claimd
            </h1>
            
            {/* Paragraph and Button below Claimd */}
            <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed max-w-2xl mx-auto">
              AI-powered processing reduces Social Security Disability Insurance (SSDI) wait times from 7 months to under 2 days
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-base font-medium text-white pointer-events-auto transition-opacity duration-300 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)'
              }}
            >
              Get Started →
            </Link>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 pointer-events-auto animate-bounce">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium text-gray-600">Scroll down</p>
            <svg 
              className="w-6 h-6 text-gray-600 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal 
        file={selectedFile} 
        onClose={() => setSelectedFileId(null)} 
      />
    </div>
  );
}