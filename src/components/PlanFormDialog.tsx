import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlanFormData {
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanFormData) => Promise<void>;
  initialData?: PlanFormData | null;
  loading?: boolean;
}

const emptyForm: PlanFormData = {
  name: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  is_active: true,
};

const PlanFormDialog: React.FC<PlanFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}) => {
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
      setFeatureInput('');
      setErrors({});
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Plan name is required';
    if (form.name.trim().length > 100) e.name = 'Name must be under 100 characters';
    if (form.price_monthly < 0) e.price_monthly = 'Price cannot be negative';
    if (form.price_yearly < 0) e.price_yearly = 'Price cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFeature = () => {
    const val = featureInput.trim();
    if (val && val.length <= 100 && !form.features.includes(val)) {
      setForm((f) => ({ ...f, features: [...f.features, val] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
  };

  const isEdit = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pro"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-desc">Description</Label>
            <Textarea
              id="plan-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
              maxLength={300}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price-mo">Monthly Price (₹)</Label>
              <Input
                id="price-mo"
                type="number"
                min={0}
                value={form.price_monthly}
                onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))}
              />
              {errors.price_monthly && <p className="text-xs text-destructive">{errors.price_monthly}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price-yr">Yearly Price (₹)</Label>
              <Input
                id="price-yr"
                type="number"
                min={0}
                value={form.price_yearly}
                onChange={(e) => setForm((f) => ({ ...f, price_yearly: Number(e.target.value) }))}
              />
              {errors.price_yearly && <p className="text-xs text-destructive">{errors.price_yearly}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add a feature"
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" size="icon" variant="outline" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormDialog;
