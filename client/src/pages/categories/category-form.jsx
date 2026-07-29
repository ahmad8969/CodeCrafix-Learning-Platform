import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ButtonLoader, PageLoader } from '@/components/loaders'
import { categorySchema } from '@/lib/course-schemas'
import { categoryService } from '@/services/course.service'
import { useCategoriesBasePath } from '@/hooks/use-course-paths'
import { notify, getErrorMessage } from '@/utils/error'

const defaults = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#10b981',
  displayOrder: 0,
  status: 'active',
  seoTitle: '',
  seoDescription: '',
}

function CategoryFormFields({ form, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Category name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="auto from name" {...register('slug')} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input id="icon" placeholder="e.g. code, brush" {...register('icon')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" type="color" className="h-10 p-1" {...register('color')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display order</Label>
            <Input id="displayOrder" type="number" {...register('displayOrder')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input id="seoTitle" {...register('seoTitle')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Input id="seoDescription" {...register('seoDescription')} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? <ButtonLoader /> : null}
          Save category
        </Button>
      </div>
    </form>
  )
}

export default function CategoryCreatePage() {
  const basePath = useCategoriesBasePath()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: defaults,
  })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await categoryService.create(values)
      notify.success('Category created')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate(basePath)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Categories', href: basePath }, { label: 'Create' }]} />
        <h1 className="mt-2 text-2xl font-extrabold">Create category</h1>
      </div>
      <CategoryFormFields form={form} onSubmit={onSubmit} submitting={submitting} />
    </PageTransition>
  )
}

export function CategoryEditPage() {
  const { id } = useParams()
  const basePath = useCategoriesBasePath()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryService.get(id),
  })

  const form = useForm({
    resolver: zodResolver(categorySchema),
    values: data
      ? {
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          icon: data.icon || '',
          color: data.color || '#10b981',
          displayOrder: data.displayOrder ?? 0,
          status: data.status || 'active',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
        }
      : defaults,
  })

  if (isLoading || !data) return <PageLoader />

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await categoryService.update(id, values)
      notify.success('Category updated')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', id] })
      navigate(basePath)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Categories', href: basePath },
            { label: data.name },
            { label: 'Edit' },
          ]}
        />
        <h1 className="mt-2 text-2xl font-extrabold">Edit category</h1>
      </div>
      <CategoryFormFields form={form} onSubmit={onSubmit} submitting={submitting} />
    </PageTransition>
  )
}
