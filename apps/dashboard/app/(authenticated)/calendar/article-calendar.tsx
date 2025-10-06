'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import useActiveProduct from '@workspace/ui/hooks/use-active-product';
import { getArticles } from '@workspace/lib/server-actions/get-articles';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

type Article = {
  id: string;
  keyword: string;
  title: string | null;
  type: 'guide' | 'listicle';
  guideSubtype: string | null;
  listicleSubtype: string | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  scheduledDate: Date;
  status: string;
};

type ArticlesByDate = {
  [date: string]: Article[];
};

export function ArticleCalendar() {
  const { data: product, isLoading: productLoading } = useActiveProduct();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchArticles() {
      if (!product?.id) return;

      setLoading(true);
      try {
        const data = await getArticles({ productId: product.id });
        if (data) {
          setArticles(
            data.map((article) => ({
              ...article,
              scheduledDate: new Date(article.scheduledDate),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [product?.id]);

  if (productLoading || loading) {
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
    const dateKey = article.scheduledDate.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(article);
    return acc;
  }, {} as ArticlesByDate);

  // Generate calendar days for the current view (3 months)
  const months = generateMonths(currentMonth, 3);

  return (
    <div className="space-y-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentMonth(newDate);
          }}
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
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      {/* Calendar Grid */}
      <div className="space-y-8">
        {months.map((month) => (
          <MonthCalendar
            key={month.monthKey}
            month={month}
            articlesByDate={articlesByDate}
          />
        ))}
      </div>
    </div>
  );
}

function MonthCalendar({
  month,
  articlesByDate,
}: {
  month: {
    monthKey: string;
    monthName: string;
    year: number;
    weeks: Date[][];
  };
  articlesByDate: ArticlesByDate;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {month.monthName} {month.year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
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
            const isCurrentMonth =
              date.getMonth() ===
              new Date(month.year, parseInt(month.monthKey) - 1, 1).getMonth();
            const dateKey = date.toISOString().split('T')[0];
            const dayArticles = articlesByDate[dateKey] || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border rounded-lg
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${isToday ? 'border-primary border-2' : 'border-border'}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    } ${isToday ? 'text-primary font-bold' : ''}`}
                  >
                    {date.getDate()}
                  </span>
                  {dayArticles.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {dayArticles.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleCard({ article }: { article: Article }) {
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
    <div className="text-xs p-2 bg-card border rounded space-y-1 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-1 flex-wrap">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(article.type)}`}
        >
          {article.type}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(article.status)}`}
        >
          {article.status}
        </span>
      </div>
      <p className="font-medium line-clamp-2 leading-tight">
        {article.title || article.keyword}
      </p>
      {article.searchVolume !== null && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px]">Vol: {article.searchVolume}</span>
          {article.keywordDifficulty !== null && (
            <>
              <span className="text-[10px]">•</span>
              <span className="text-[10px]">
                Diff: {article.keywordDifficulty}%
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

// Helper function to generate calendar months
function generateMonths(startMonth: Date, count: number) {
  const months = [];

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

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust to start on Monday (1) instead of Sunday (0)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday becomes 6

    // Generate weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Fill in days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      currentWeek.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Fill in days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in remaining days from next month
    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(year, month + 1, nextMonthDay));
        nextMonthDay++;
      }
      weeks.push(currentWeek);
    }

    months.push({
      monthKey,
      monthName,
      year,
      weeks,
    });
  }

  return months;
}
