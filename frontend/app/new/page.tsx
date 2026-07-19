'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '@/services/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FolderPlus } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Dokploy TRPC payload has project nested, or our backend unwraps it.
      // the backend returns `res.status(201).json(dpProject)`.
      // dpProject contains `project` and `environment`.
      const projectId = data?.project?.projectId || data?.projectId;
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        router.push('/projects');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name: name.trim() });
  };

  return (
    <div className="flex-1 p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl">
        <Link href="/projects" className="inline-flex items-center text-sm text-[#A1A1AA] hover:text-white mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-[#111111] border-[#27272A] text-white">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <FolderPlus className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Create New Project</CardTitle>
                <CardDescription className="text-[#A1A1AA]">
                  Projects help you organize your applications and environments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Project Name</label>
                  <Input 
                    placeholder="e.g. ecommerce-platform" 
                    className="bg-[#18181B] border-[#27272A] text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white h-12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-[#A1A1AA]">
                    Choose a descriptive, unique name for your project.
                  </p>
                </div>
                
                {mutation.isError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
                    Failed to create project. Please try again.
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-4 border-t border-[#27272A] pt-6">
                <Link href="/projects">
                  <Button variant="ghost" type="button" className="text-[#A1A1AA] hover:text-white hover:bg-[#27272A]">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="bg-white text-black hover:bg-gray-200"
                  disabled={!name.trim() || mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
