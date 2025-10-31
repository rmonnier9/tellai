'use client';

import { enqueueJob } from '@workspace/lib/enqueue-job';
import { addKeywordsManually } from '@workspace/lib/server-actions/add-keywords-manually';
import { deleteArticle } from '@workspace/lib/server-actions/delete-article';
import { updateArticleSchedule } from '@workspace/lib/server-actions/update-article-schedule';
import { updateArticleSettings } from '@workspace/lib/server-actions/update-article-settings';
import { AddKeywordsModal } from '@workspace/ui/components/add-keywords-modal';
import { ArticleSettingsModal } from '@workspace/ui/components/article-settings-modal';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import useActiveProduct from '@workspace/ui/hooks/use-active-product';
import useArticles from '@workspace/ui/hooks/use-articles';
import useContentPlannerWatcher from '@workspace/ui/hooks/use-content-planner-watcher';
import useJob from '@workspace/ui/hooks/use-job';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@workspace/ui/lib/dnd';
import { toast } from '@workspace/ui/lib/toast';
import {
  Calendar as CalendarIcon,
  Eye,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type Article = {
  id: string;
  keyword: string;
  title: string | null;
  type: 'guide' | 'listicle';
  guideSubtype: string | null;
  listicleSubtype: string | null;
  contentLength: 'short' | 'medium' | 'long' | 'comprehensive' | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  scheduledDate: Date;
  status: string;
  publications?: Array<{
    id: string;
    url: string | null;
    credential: {
      id: string;
      type: string;
      name: string | null;
    };
  }>;
  jobs?: Array<{
    id: string;
    type: string;
    status: string;
  }>;
};

type ArticlesByDate = {
  [date: string]: Article[];
};

// Helper function to format date as YYYY-MM-DD in local timezone
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ArticleCalendar() {
  const { data: product, isLoading: productLoading } = useActiveProduct();
  const {
    data: articlesData,
    isLoading: articlesLoading,
    mutate: mutateArticles,
  } = useArticles({ productId: product?.id });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [articleJobIds, setArticleJobIds] = useState<Map<string, string>>(
    new Map()
  );
  const [isAddKeywordsModalOpen, setIsAddKeywordsModalOpen] = useState(false);
  const [isSubmittingKeywords, setIsSubmittingKeywords] = useState(false);
  const [selectedArticleForSettings, setSelectedArticleForSettings] =
    useState<Article | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Convert article dates to Date objects (memoized)
  const articles = useMemo(() => {
    if (!articlesData) return [];
    return articlesData.map((article) => ({
      ...article,
      scheduledDate: new Date(article.scheduledDate),
    }));
  }, [articlesData]);

  // Initialize articleJobIds from active jobs in articles data
  useEffect(() => {
    if (!articles) return;

    const activeJobs = new Map<string, string>();
    articles.forEach((article) => {
      // Get the first (most recent) active job if it exists
      const activeJob = article.jobs?.[0];
      if (activeJob) {
        activeJobs.set(article.id, activeJob.id);
      }
    });

    // Only update if there are changes to prevent infinite loops
    setArticleJobIds((prev) => {
      const hasChanges =
        prev.size !== activeJobs.size ||
        Array.from(activeJobs.entries()).some(
          ([articleId, jobId]) => prev.get(articleId) !== jobId
        );

      return hasChanges ? activeJobs : prev;
    });
  }, [articles]);

  // Watch for content planner job completion and revalidate SWR cache
  useContentPlannerWatcher({
    onComplete: () => {
      toast.success('Content plan created successfully!');
      mutateArticles(); // Revalidate SWR cache
    },
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !product?.id) return;

    const articleId = active.id as string;
    const targetDateString = over.id as string;

    // Parse the target date (YYYY-MM-DD format)
    const [year, month, day] = targetDateString.split('-').map(Number);
    const targetDate = new Date(year!, month! - 1, day!);

    // Find the article being dragged
    const draggedArticle = articles.find((a) => a.id === articleId);
    if (!draggedArticle) return;

    // Check if date is different
    const currentDateString = formatDateKey(draggedArticle.scheduledDate);
    if (currentDateString === targetDateString) return;

    // Update the article schedule
    const result = await updateArticleSchedule({
      articleId,
      newDate: targetDate,
      productId: product.id,
    });

    if (result.success) {
      // Revalidate SWR cache to get fresh data
      await mutateArticles();

      if (result.swapped) {
        toast.success('Articles swapped successfully');
      } else {
        toast.success('Article rescheduled successfully');
      }
    } else {
      toast.error(result.error || 'Failed to update schedule');
    }
  }

  async function handleGenerateArticle(articleId: string) {
    if (!product?.id) return;

    try {
      // Enqueue article generation job
      const jobId = await enqueueJob({
        jobType: 'article_generation',
        articleId,
        productId: product.id,
      });

      if (jobId) {
        // Track the job ID for this article
        setArticleJobIds((prev) => new Map(prev).set(articleId, jobId));
        toast.success('Article generation started!');
      }
    } catch (error) {
      console.error('Error starting article generation:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start article generation'
      );
    }
  }

  async function handleDeleteArticle(articleId: string) {
    if (!product?.id) return;

    try {
      const result = await deleteArticle({
        articleId,
        productId: product.id,
      });

      if (result.success) {
        toast.success('Article deleted successfully');
        // Revalidate SWR cache to get fresh data
        await mutateArticles();
      } else {
        toast.error(result.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete article'
      );
    }
  }

  async function handleAddKeywords(keywords: string[]) {
    if (!product?.id) return;

    setIsSubmittingKeywords(true);
    try {
      const result = await addKeywordsManually({
        productId: product.id,
        keywords,
      });

      if (result.success) {
        toast.success(
          `Successfully added ${result.addedCount} keyword${result.addedCount! > 1 ? 's' : ''} to your calendar`
        );
        setIsAddKeywordsModalOpen(false);
        // Revalidate SWR cache to get fresh data
        await mutateArticles();
      } else {
        toast.error(result.error || 'Failed to add keywords');
      }
    } catch (error) {
      console.error('Error adding keywords:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add keywords'
      );
    } finally {
      setIsSubmittingKeywords(false);
    }
  }

  async function handleSaveArticleSettings(data: {
    type: 'guide' | 'listicle' | null;
    guideSubtype: 'how_to' | 'explainer' | 'comparison' | 'reference' | null;
    listicleSubtype: 'round_up' | 'resources' | 'examples' | null;
    contentLength: 'short' | 'medium' | 'long' | 'comprehensive' | null;
  }) {
    if (!selectedArticleForSettings) return;

    setIsSavingSettings(true);
    try {
      const result = await updateArticleSettings({
        articleId: selectedArticleForSettings.id,
        ...data,
      });

      if (result.success) {
        toast.success('Article settings updated successfully!');
        setSelectedArticleForSettings(null);
        // Revalidate SWR cache to get fresh data
        await mutateArticles();
      } else {
        toast.error(result.error || 'Failed to update article settings');
      }
    } catch (error) {
      console.error('Error updating article settings:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update article settings'
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  // Calculate available slots (dates without articles in the next 60 days)
  const availableSlots = useMemo(() => {
    if (!articles) return 60;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingDatesSet = new Set(
      articles.map((a) => {
        const date = new Date(a.scheduledDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let count = 0;
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(0, 0, 0, 0);

      if (!existingDatesSet.has(checkDate.getTime())) {
        count++;
      }
    }

    return count;
  }, [articles]);

  if (productLoading || articlesLoading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Product Selected</h3>
            <p className="text-muted-foreground mt-2">
              Please select a product to view its post calendar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group articles by date
  const articlesByDate: ArticlesByDate = articles.reduce((acc, article) => {
    const dateKey = formatDateKey(article.scheduledDate);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey]!.push(article as Article);
    return acc;
  }, {} as ArticlesByDate);

  // Generate calendar days for the current view (3 months)
  const months = generateMonths(currentMonth, 3);

  // Find the active article for drag overlay
  const activeArticle = activeId
    ? articles.find((a) => a.id === activeId)
    : null;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Post Calendar
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              View and manage your scheduled articles for the next 60 days
            </p>
          </div>
          <Button
            onClick={() => setIsAddKeywordsModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Keywords
          </Button>
        </div>

        {/* Calendar Navigation */}
        {/* <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentMonth(newDate);
            }}
            disabled={
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear()
            }
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            {currentMonth.toLocaleDateString('default', {
              month: 'long',
              year: 'numeric',
            })}{' '}
            -{' '}
            {new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth() + 2,
              1
            ).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentMonth(newDate);
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div> */}

        {/* Stats Summary */}
        {/* <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {articles.filter((a) => a.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {articles.filter((a) => a.status === 'generated').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {articles.filter((a) => a.status === 'published').length}
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Calendar Grid */}
        <div className="space-y-8">
          {months.map((month) => (
            <MonthCalendar
              key={month.monthKey}
              month={month}
              articlesByDate={articlesByDate}
              onGenerateArticle={handleGenerateArticle}
              onDeleteArticle={handleDeleteArticle}
              articleJobIds={articleJobIds}
              onJobComplete={(articleId) => {
                // Remove job ID from map when complete
                setArticleJobIds((prev) => {
                  const next = new Map(prev);
                  next.delete(articleId);
                  return next;
                });
                // Revalidate articles to show updated data
                mutateArticles();
              }}
              onOpenSettings={setSelectedArticleForSettings}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeArticle ? (
          <ArticleCardDragOverlay article={activeArticle as Article} />
        ) : null}
      </DragOverlay>

      {/* Add Keywords Modal */}
      <AddKeywordsModal
        open={isAddKeywordsModalOpen}
        onOpenChange={setIsAddKeywordsModalOpen}
        availableSlots={availableSlots}
        onSubmit={handleAddKeywords}
        isSubmitting={isSubmittingKeywords}
      />

      {/* Article Settings Modal */}
      {selectedArticleForSettings && (
        <ArticleSettingsModal
          open={!!selectedArticleForSettings}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedArticleForSettings(null);
            }
          }}
          article={{
            id: selectedArticleForSettings.id,
            keyword: selectedArticleForSettings.keyword,
            type: selectedArticleForSettings.type as
              | 'guide'
              | 'listicle'
              | null,
            guideSubtype: selectedArticleForSettings.guideSubtype as
              | 'how_to'
              | 'explainer'
              | 'comparison'
              | 'reference'
              | null,
            listicleSubtype: selectedArticleForSettings.listicleSubtype as
              | 'round_up'
              | 'resources'
              | 'examples'
              | null,
            contentLength: selectedArticleForSettings.contentLength as
              | 'short'
              | 'medium'
              | 'long'
              | 'comprehensive'
              | null,
          }}
          onSave={handleSaveArticleSettings}
          isSaving={isSavingSettings}
        />
      )}
    </DndContext>
  );
}

function MonthCalendar({
  month,
  articlesByDate,
  onGenerateArticle,
  onDeleteArticle,
  articleJobIds,
  onJobComplete,
  onOpenSettings,
}: {
  month: {
    monthKey: string;
    monthName: string;
    year: number;
    weeks: Date[][];
  };
  articlesByDate: ArticlesByDate;
  onGenerateArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  articleJobIds: Map<string, string>;
  onJobComplete: (articleId: string) => void;
  onOpenSettings: (article: Article) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to today's date on mount (only on mobile)
  useEffect(() => {
    if (
      todayRef.current &&
      scrollContainerRef.current &&
      window.innerWidth < 768
    ) {
      const container = scrollContainerRef.current;
      const todayElement = todayRef.current;

      // Calculate scroll position to center today's date
      const scrollPosition =
        todayElement.offsetLeft -
        container.clientWidth / 2 +
        todayElement.clientWidth / 2;

      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {month.monthName} {month.year}
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={scrollContainerRef}
        className="overflow-x-auto relative before:pointer-events-none before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-8 before:bg-gradient-to-r before:from-background before:to-transparent before:opacity-0 before:transition-opacity after:pointer-events-none after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent after:opacity-100 md:before:opacity-0 md:after:opacity-0"
      >
        <div className="grid grid-cols-7 gap-2 min-w-[1050px] md:min-w-0">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {month.weeks.flat().map((date, index) => {
            // Check if this is a placeholder date (epoch date)
            const isPlaceholder = date.getTime() === 0;

            if (isPlaceholder) {
              return <div key={index} className="min-h-[120px]" />;
            }

            const isCurrentMonth =
              date.getMonth() ===
              new Date(month.year, parseInt(month.monthKey) - 1, 1).getMonth();
            const dateKey = formatDateKey(date);
            const dayArticles = articlesByDate[dateKey] || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();

            return (
              <DroppableDay
                key={index}
                date={date}
                dateKey={dateKey}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                dayArticles={dayArticles}
                onGenerateArticle={onGenerateArticle}
                onDeleteArticle={onDeleteArticle}
                articleJobIds={articleJobIds}
                onJobComplete={onJobComplete}
                onOpenSettings={onOpenSettings}
                todayRef={isToday ? todayRef : undefined}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableDay({
  date,
  dateKey,
  isCurrentMonth,
  isToday,
  dayArticles,
  onGenerateArticle,
  onDeleteArticle,
  articleJobIds,
  onJobComplete,
  onOpenSettings,
  todayRef,
}: {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayArticles: Article[];
  onGenerateArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  articleJobIds: Map<string, string>;
  onJobComplete: (articleId: string) => void;
  onOpenSettings: (article: Article) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
}) {
  // Disable dropping if there are any generated or published articles on this day
  const hasNonPendingArticles = dayArticles.some(
    (article) =>
      article.status === 'generated' || article.status === 'published'
  );

  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    disabled: hasNonPendingArticles,
  });

  // Combine refs for droppable and today scroll target
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (todayRef && node) {
      (todayRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`
        min-h-[140px] md:min-h-[120px] p-2 border rounded-lg transition-colors
        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
        ${isToday ? 'border-primary border-2' : 'border-border'}
        ${isOver && !hasNonPendingArticles ? 'bg-primary/10 border-primary' : ''}
        ${hasNonPendingArticles ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm md:text-sm font-medium ${
            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
          } ${isToday ? 'text-primary font-bold' : ''}`}
        >
          {date.getDate()}
        </span>
        {/* {dayArticles.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {dayArticles.length}
          </span>
        )} */}
      </div>
      <div className="space-y-1">
        {dayArticles.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <p className="text-xs text-muted-foreground italic">
              No article scheduled
            </p>
          </div>
        ) : (
          dayArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onGenerate={onGenerateArticle}
              onDelete={onDeleteArticle}
              jobId={articleJobIds.get(article.id)}
              onJobComplete={onJobComplete}
              onOpenSettings={onOpenSettings}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  onGenerate,
  onDelete,
  jobId,
  onJobComplete,
  onOpenSettings,
}: {
  article: Article;
  onGenerate: (articleId: string) => void;
  onDelete: (articleId: string) => void;
  jobId?: string;
  onJobComplete: (articleId: string) => void;
  onOpenSettings: (article: Article) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  // Watch job status if there's an active job
  const { data: job } = useJob({ id: jobId });

  // Handle job completion
  useEffect(() => {
    if (!job || !jobId) return;

    if (job.status === 'done') {
      toast.success('Article content generated successfully!');
      onJobComplete(article.id);
    } else if (job.status === 'error') {
      toast.error(job.error || 'Failed to generate article');
      onJobComplete(article.id);
    }
  }, [job, jobId, article.id, onJobComplete]);

  const isGenerating = job?.status === 'running' || job?.status === 'pending';
  const isDraggable = article.status === 'pending' && !isGenerating;

  // Check if article is scheduled for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(article.scheduledDate);
  scheduledDate.setHours(0, 0, 0, 0);
  const isToday = scheduledDate.getTime() === today.getTime();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: article.id,
      disabled: !isDraggable,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'generated':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'listicle':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`text-xs p-2 bg-card border rounded space-y-1 transition-shadow relative ${
        isDraggable ? 'hover:shadow-md' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action buttons - only show on hover for pending articles */}
      {isHovered && article.status === 'pending' && !isGenerating && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(article);
            }}
            className="p-1 rounded bg-neutral-500 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-700 transition-colors"
            title="Article settings"
          >
            <Settings className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(article.id);
            }}
            className="p-1 rounded bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
            title="Delete article"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      <div
        {...listeners}
        {...attributes}
        className={`space-y-1 ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div className="flex items-center gap-1 flex-wrap">
          {article.type && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(article.type)}`}
            >
              {article.type}
            </span>
          )}
        </div>
        <p className="font-medium line-clamp-2 leading-tight">
          {article.status === 'pending'
            ? article.keyword
            : article.title || article.keyword}
        </p>
        {article.searchVolume !== null && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[10px] md:text-[10px]">
              Vol: {article.searchVolume}
            </span>
            {article.keywordDifficulty !== null && (
              <>
                <span className="text-[10px]">•</span>
                <span className="text-[10px] md:text-[10px]">
                  KD: {article.keywordDifficulty}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-1">
        {/* Generate button - only show for pending articles scheduled for today */}
        {article.status === 'pending' && isToday && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerate(article.id);
            }}
            disabled={isGenerating}
            className={`w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-2 md:py-1.5 rounded text-[11px] md:text-[10px] font-medium transition-colors touch-manipulation ${
              isGenerating
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 cursor-pointer active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                <span>Generate</span>
              </>
            )}
          </button>
        )}

        {/* View button - show for generated and published articles */}
        {(article.status === 'generated' || article.status === 'published') && (
          <Link
            href={`/articles/${article.id}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-2 md:py-1.5 rounded text-[11px] md:text-[10px] font-medium transition-colors touch-manipulation bg-neutral-500 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-700 active:scale-95"
          >
            <Eye className="h-3 w-3" />
            <span>View Article</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function ArticleCardDragOverlay({ article }: { article: Article }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'generated':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'listicle':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="text-xs p-2 bg-card border rounded space-y-1 shadow-lg cursor-grabbing opacity-90 rotate-3">
      <div className="flex items-center gap-1 flex-wrap">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(article.type)}`}
        >
          {article.type}
        </span>
      </div>
      <p className="font-medium line-clamp-2 leading-tight">
        {article.status === 'pending'
          ? article.keyword
          : article.title || article.keyword}
      </p>
      {article.searchVolume !== null && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px]">Vol: {article.searchVolume}</span>
          {article.keywordDifficulty !== null && (
            <>
              <span className="text-[10px]">•</span>
              <span className="text-[10px]">
                KD: {article.keywordDifficulty}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to generate calendar months starting from today
function generateMonths(startMonth: Date, count: number) {
  const months = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const monthDate = new Date(
      startMonth.getFullYear(),
      startMonth.getMonth() + i,
      1
    );
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const monthName = monthDate.toLocaleDateString('default', {
      month: 'long',
    });
    const monthKey = `${month + 1}`;

    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Determine the actual start day (either first of month or today)
    const isFirstMonth = i === 0;
    const startDayOfMonth =
      isFirstMonth && today.getMonth() === month && today.getFullYear() === year
        ? today.getDate()
        : 1;

    // Get the day of week for the first day we're showing
    const firstDayToShow = new Date(year, month, startDayOfMonth);
    let dayOfWeek = firstDayToShow.getDay() - 1; // Adjust to Monday = 0
    if (dayOfWeek === -1) dayOfWeek = 6; // Sunday becomes 6

    // Generate weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add empty slots for days before our start day in the first week
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(new Date(0)); // Use epoch date as placeholder
    }

    // Fill in days from start day to end of month
    for (let day = startDayOfMonth; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);

      // Only add dates that are today or in the future
      if (date >= today) {
        currentWeek.push(date);

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }
    }

    // Push remaining days if any
    if (currentWeek.length > 0) {
      // Fill remaining slots with placeholder dates
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0));
      }
      weeks.push(currentWeek);
    }

    // Only add month if it has weeks with valid dates
    if (weeks.length > 0) {
      months.push({
        monthKey,
        monthName,
        year,
        weeks,
      });
    }
  }

  return months;
}
