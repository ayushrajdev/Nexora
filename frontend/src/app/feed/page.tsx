'use client';

import React, { useEffect } from 'react';
import { Compass, RefreshCw, Filter, Loader2, Keyboard } from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { DeveloperCard } from '@/components/features/feed/DeveloperCard';
import { Button } from '@/components/ui/Button';
import { useFeed } from '@/hooks/useFeed';
import { cn } from '@/lib/utils';

export default function FeedPage() {
    const {
        currentCandidate,
        nextCandidate,
        totalRemaining,
        availableSkills,
        selectedSkill,
        setSelectedSkill,
        isLoading,
        isSwiping,
        error,
        handleSwipe,
        reloadFeed,
        loadMore,
    } = useFeed();

    // Keyboard navigation: Left Arrow = Ignored, Right Arrow = Interested
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentCandidate || isSwiping) return;
            if (
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA'
            ) {
                return;
            }
            if (e.key === 'ArrowLeft') {
                handleSwipe('ignored', currentCandidate);
            } else if (e.key === 'ArrowRight') {
                handleSwipe('interested', currentCandidate);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentCandidate, isSwiping, handleSwipe]);

    return (
        <AuthGuard>
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Bar & Skill Filters */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                            <Compass className="h-6 w-6 text-brand-500" />
                            <span>Discover Developers</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Swipe right to send a connection request or use
                            arrow keys
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
                            <Keyboard className="w-3.5 h-3.5 text-brand-400" />
                            <span>← Ignore / → Interested</span>
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={reloadFeed}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                            Refresh Deck
                        </Button>
                    </div>
                </div>

                {/* Skill Filter Pills */}
                {availableSkills.length > 0 && (
                    <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-2">
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 shrink-0 mr-1">
                            <Filter className="w-3.5 h-3.5 text-brand-400" />
                            Stack:
                        </span>
                        <button
                            onClick={() => setSelectedSkill(null)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition-all shrink-0',
                                selectedSkill === null
                                    ? 'border-brand-500 bg-brand-500/20 text-brand-200'
                                    : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200',
                            )}
                        >
                            All ({totalRemaining})
                        </button>
                        {availableSkills.map((skill) => (
                            <button
                                key={skill}
                                onClick={() =>
                                    setSelectedSkill(
                                        selectedSkill === skill ? null : skill,
                                    )
                                }
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-all shrink-0',
                                    selectedSkill === skill
                                        ? 'border-brand-500 bg-brand-500/20 text-brand-200'
                                        : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200',
                                )}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Deck Area */}
                <div className="flex flex-col items-center justify-center min-h-[520px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                            <p className="text-sm font-medium">
                                Curating developer profiles for your feed...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/30 p-6 text-center space-y-3">
                            <p className="text-sm font-semibold text-rose-200">
                                {error}
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={reloadFeed}
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : currentCandidate ? (
                        <div className="relative flex w-full justify-center">
                            {/* Background Next Card Stack Shadow */}
                            {nextCandidate && (
                                <div className="pointer-events-none absolute top-4 scale-[0.95] opacity-40 blur-[1px] transition-all">
                                    <DeveloperCard
                                        profile={nextCandidate}
                                        isPreview
                                    />
                                </div>
                            )}

                            {/* Active Top Card */}
                            <div className="relative z-10 w-full flex justify-center">
                                <DeveloperCard
                                    profile={currentCandidate}
                                    onSwipe={handleSwipe}
                                    isSwiping={isSwiping}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md rounded-3xl border border-slate-800/90 bg-slate-900/70 p-8 text-center space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
                                <Compass className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    You&apos;ve seen everyone in this batch!
                                </h2>
                                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                    {selectedSkill
                                        ? `No more profiles matching "${selectedSkill}". Clear the filter or load more builders.`
                                        : 'Check back soon or load the next batch of developer profiles.'}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                {selectedSkill && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedSkill(null)}
                                    >
                                        Clear Filter
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={loadMore}
                                    leftIcon={<RefreshCw className="w-4 h-4" />}
                                >
                                    Load More Profiles
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
