"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  extension?: string;
  category?: string;
  children?: TreeNode[];
}

interface FlatNode {
  node: TreeNode;
  depth: number;
  index: number;
}

function flattenTree(tree: TreeNode[], depth: number, startIndex: { value: number }): FlatNode[] {
  const out: FlatNode[] = [];
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]!;
    const index = startIndex.value++;
    out.push({ node, depth, index });
    if (node.type === "folder" && node.children?.length) {
      out.push(...flattenTree(node.children, depth + 1, startIndex));
    }
  }
  return out;
}

const CATEGORY_COLORS: Record<string, string> = {
  folder: "#6b7280",
  code: "#22c55e",
  image: "#3b82f6",
  file: "#f97316",
};

function sizeToScale(size: number, isFolder: boolean): number {
  if (isFolder) return 0.4;
  const log = Math.log1p(size);
  return Math.min(0.3 + log * 0.08, 1.2);
}

function FileNode({
  flatNode,
  onClick,
}: {
  flatNode: FlatNode;
  onClick: (node: TreeNode) => void;
}) {
  const { node, depth, index } = flatNode;
  const isFolder = node.type === "folder";
  const size = node.size ?? 0;
  const scale = sizeToScale(size, isFolder);
  const color = CATEGORY_COLORS[node.category || "file"] ?? CATEGORY_COLORS.file;
  const x = (index % 12) - 6;
  const z = Math.floor(index / 12) - 4;
  const y = depth * 0.6;

  return (
    <group
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[scale, scale, scale]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

function Scene({
  tree,
  onNodeClick,
}: {
  tree: TreeNode[];
  onNodeClick: (node: TreeNode) => void;
}) {
  const flat = useMemo(() => flattenTree(tree, 0, { value: 0 }), [tree]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      {flat.map((fn, i) => (
        <FileNode key={`${fn.node.path}-${i}`} flatNode={fn} onClick={onNodeClick} />
      ))}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default function Workspace3DScene({
  tree,
  onNodeClick,
}: {
  tree: TreeNode[];
  onNodeClick: (node: TreeNode) => void;
}) {
  return (
    <div className="w-full h-full min-h-[400px]" style={{ background: "var(--background)" }}>
      <Canvas
        camera={{ position: [8, 6, 12], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="var(--accent)" />
            </mesh>
          }
        >
          <Scene tree={tree} onNodeClick={onNodeClick} />
        </Suspense>
      </Canvas>
    </div>
  );
}
