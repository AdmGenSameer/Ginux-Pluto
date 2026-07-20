"use client";

import { cn } from "@/lib/utils";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getProjects, createProject, type DokployProject } from '@/services/projects';
import { createApplication, saveProvider, deployApplication } from '@/services/applications';
import { getRepositories, getBranches } from '@/services/github';
import { ArrowLeft, ArrowRight, Check, FolderOpen, GitFork, GitBranch, Settings, Rocket, Loader2, Box, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  { id: 1, label: 'Project', icon: FolderOpen },
  { id: 2, label: 'Repository', icon: GitFork },
  { id: 3, label: 'Branch', icon: GitBranch },
  { id: 4, label: 'Configure', icon: Settings },
  { id: 5, label: 'Deploy', icon: Rocket },
];

export default function DeployWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [createNewProject, setCreateNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Step 2
  const [selectedRepo, setSelectedRepo] = useState('');
  const [repoSearch, setRepoSearch] = useState('');

  // Step 3
  const [selectedBranch, setSelectedBranch] = useState('');

  // Step 4
  const [appName, setAppName] = useState('');
  const [buildType, setBuildType] = useState<'nixpacks' | 'dockerfile' | 'heroku' | 'paketo'>('nixpacks');
  const [buildPath, setBuildPath] = useState('/');
  const [autoDeploy, setAutoDeploy] = useState(true);

  // Step 5
  const [deployedAppId, setDeployedAppId] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: repositories, isLoading: loadingRepos } = useQuery({
    queryKey: ['repositories'],
    queryFn: getRepositories,
  });
  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ['branches', selectedRepo],
    queryFn: () => getBranches(selectedRepo),
    enabled: !!selectedRepo,
  });

  const createProjectMutation = useMutation({ mutationFn: createProject });
  const createAppMutation = useMutation({ mutationFn: createApplication });
  const saveProviderMutation = useMutation({ mutationFn: ({ id, ...rest }: any) => saveProvider(id, rest) });
  const deployMutation = useMutation({ mutationFn: deployApplication });

  const filteredRepos = (repositories ?? []).filter((r: any) =>
    (r.full_name ?? '').toLowerCase().includes(repoSearch.toLowerCase())
  );

  const handleNextStep = async () => {
    if (step === 1) {
      if (createNewProject && !newProjectName.trim()) return toast.error('Enter a project name');
      if (!createNewProject && !selectedProjectId) return toast.error('Select a project');
      if (createNewProject) {
        const result = await createProjectMutation.mutateAsync({ name: newProjectName.trim() });
        const pid = result?.project?.projectId || result?.projectId;
        const eid = result?.environment?.environmentId || result?.environmentId;
        setSelectedProjectId(pid);
        setSelectedEnvId(eid);
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedRepo) return toast.error('Select a repository');
      if (!appName) setAppName(selectedRepo.split('/')[1] || '');
      setStep(3);
    } else if (step === 3) {
      if (!selectedBranch) return toast.error('Select a branch');
      if (!appName) setAppName(selectedRepo.split('/')[1] || '');
      setStep(4);
    } else if (step === 4) {
      if (!appName.trim()) return toast.error('Enter an application name');
      setIsDeploying(true);
      try {
        // Create application
        const project = projects?.find((p: DokployProject) => p.projectId === selectedProjectId);
        const envId = selectedEnvId || project?.environments?.[0]?.environmentId;
        const app = await createAppMutation.mutateAsync({
          projectId: selectedProjectId,
          environmentId: envId!,
          name: appName.trim(),
        });

        // Save provider
        await saveProviderMutation.mutateAsync({
          id: app.applicationId,
          repository: selectedRepo,
          branch: selectedBranch,
          buildType,
          buildPath,
        });

        // Deploy
        await deployMutation.mutateAsync(app.applicationId);
        setDeployedAppId(app.applicationId);
        setStep(5);
      } catch (e) {
        toast.error('Deployment failed — check your settings');
      } finally {
        setIsDeploying(false);
      }
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10 max-w-3xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-1">New Deployment</h1>
        <p className="text-sm text-zinc-500">Deploy from a GitHub repository in a few steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step === s.id ? 'text-white' : step > s.id ? 'text-green-400' : 'text-zinc-600'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                step > s.id ? 'bg-green-500 border-green-500 text-white' :
                step === s.id ? 'bg-blue-600 border-blue-600 text-white' :
                'border-white/10 text-zinc-600'
              }`}>
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-white' : 'text-zinc-600'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${step > s.id ? 'bg-green-500/40' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 md:p-8 mb-6 min-h-64">

        {/* Step 1: Project */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Select a Project</h2>
            <div className="space-y-2 mb-6">
              {(projects ?? []).map((p: DokployProject) => (
                <button
                  key={p.projectId}
                  onClick={() => {
                    setSelectedProjectId(p.projectId);
                    setSelectedEnvId(p.environments?.[0]?.environmentId ?? '');
                    setCreateNewProject(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                    selectedProjectId === p.projectId && !createNewProject
                      ? 'border-blue-500 bg-blue-600/10'
                      : 'border-white/8 hover:border-white/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.environments?.flatMap(e => e.applications).length ?? 0} services</p>
                  </div>
                  {selectedProjectId === p.projectId && !createNewProject && (
                    <Check className="h-4 w-4 text-blue-400 ml-auto" />
                  )}
                </button>
              ))}

              <button
                onClick={() => { setCreateNewProject(true); setSelectedProjectId(''); }}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border border-dashed ${
                  createNewProject ? 'border-blue-500 bg-blue-600/10' : 'border-white/15 hover:border-white/25'
                }`}
              >
                <Box className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Create new project</span>
              </button>
            </div>

            {createNewProject && (
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            )}
          </div>
        )}

        {/* Step 2: Repository */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Choose a Repository</h2>
            <input
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              placeholder="Search repositories..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all mb-4"
            />
            {loadingRepos ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : filteredRepos.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No repositories found</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredRepos.map((repo: any) => (
                  <button
                    key={repo.id || repo.full_name}
                    onClick={() => setSelectedRepo(repo.full_name)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                      selectedRepo === repo.full_name
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-white/8 hover:border-white/15 hover:bg-white/[0.03]'
                    }`}
                  >
                    <GitFork className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-white">{repo.full_name}</span>
                    {selectedRepo === repo.full_name && <Check className="h-4 w-4 text-blue-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Branch */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Choose a Branch</h2>
            <p className="text-sm text-zinc-500 mb-4">From repository: <span className="text-white">{selectedRepo}</span></p>
            {loadingBranches ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (branches ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No branches found</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(branches ?? []).map((branch: any) => (
                  <button
                    key={branch.name}
                    onClick={() => setSelectedBranch(branch.name)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                      selectedBranch === branch.name
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-white/8 hover:border-white/15 hover:bg-white/[0.03]'
                    }`}
                  >
                    <GitBranch className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-white">{branch.name}</span>
                    {selectedBranch === branch.name && <Check className="h-4 w-4 text-blue-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Configure */}
        {step === 4 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Configure Application</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Application Name</label>
                <input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder={selectedRepo.split('/')[1] || 'my-app'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-start gap-3 p-4 mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-100/90 leading-relaxed">
                      Builders can consume significant memory during the build process, ensure your server has enough resources. Some builders are suitable for development but may not be optimal for production environments.
                    </p>
                  </div>
                  <label className="block text-sm font-semibold text-white mb-3">Build Type</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'dockerfile', label: 'Dockerfile' },
                      { id: 'railpack', label: 'Railpack', badge: 'New' },
                      { id: 'nixpacks', label: 'Nixpacks' },
                      { id: 'heroku', label: 'Heroku Buildpacks' },
                      { id: 'paketo', label: 'Paketo Buildpacks' },
                      { id: 'static', label: 'Static' },
                    ].map((option) => (
                      <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="buildType"
                            value={option.id}
                            checked={buildType === option.id}
                            onChange={(e) => setBuildType(e.target.value as any)}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 rounded-full border border-white/20 bg-transparent peer-checked:border-blue-500 flex items-center justify-center transition-colors group-hover:border-white/40 peer-checked:group-hover:border-blue-400">
                            <div className={cn("w-2.5 h-2.5 rounded-full bg-blue-500 transition-all", buildType === option.id ? "scale-100 opacity-100" : "scale-0 opacity-0")}></div>
                          </div>
                        </div>
                        <span className="text-sm text-zinc-200">{option.label}</span>
                        {option.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-black bg-zinc-200 rounded-full">
                            {option.badge}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Build Path</label>
                  <input
                    value={buildPath}
                    onChange={(e) => setBuildPath(e.target.value)}
                    placeholder="/"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 px-4 rounded-lg border border-white/8 bg-white/[0.02]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Auto Deploy</p>
                  <p className="text-xs text-zinc-500">Automatically deploy on every push</p>
                </div>
                <button
                  onClick={() => setAutoDeploy(!autoDeploy)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoDeploy ? 'bg-blue-600' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${autoDeploy ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Deployment Summary</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Repository</span><span className="text-white">{selectedRepo}</span>
                  <span className="text-zinc-500">Branch</span><span className="text-white">{selectedBranch}</span>
                  <span className="text-zinc-500">Build Type</span><span className="text-white">{buildType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Deployed */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Deployment Started!</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
              Your application is being deployed. It may take a few minutes to become available.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/services/${deployedAppId}`)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                View Service Settings
              </button>
              <button
                onClick={() => router.push('/applications')}
                className="flex items-center gap-2 rounded-lg border border-white/10 hover:bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors"
              >
                All Applications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={isDeploying}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deploying...
              </>
            ) : step === 4 ? (
              <>
                <Rocket className="h-3.5 w-3.5" />
                Deploy
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
