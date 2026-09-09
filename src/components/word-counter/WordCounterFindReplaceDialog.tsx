import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  findQuery: string;
  setFindQuery: (query: string) => void;
  replaceQuery: string;
  setReplaceQuery: (query: string) => void;
  isMatchCase: boolean;
  setIsMatchCase: (matchCase: boolean) => void;
  matchCount: number;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
}

export function WordCounterFindReplaceDialog({
  isOpen,
  onOpenChange,
  findQuery,
  setFindQuery,
  replaceQuery,
  setReplaceQuery,
  isMatchCase,
  setIsMatchCase,
  matchCount,
  onReplaceOne,
  onReplaceAll,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Find and Replace</DialogTitle>
          <DialogDescription className="text-xs">
            Search and replace text in your current document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <Label htmlFor="find-input">Find:</Label>
            <Input
              id="find-input"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Text to find..."
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="replace-input">Replace with:</Label>
            <Input
              id="replace-input"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replacement text..."
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isMatchCase}
                onChange={(e) => setIsMatchCase(e.target.checked)}
                className="rounded border-border"
              />
              Match case
            </label>

            {findQuery && (
              <span className="text-xs font-mono text-muted-foreground">
                {matchCount} matches found
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReplaceOne}
            disabled={matchCount === 0}
            className="text-xs"
          >
            Replace One
          </Button>
          <Button
            size="sm"
            onClick={onReplaceAll}
            disabled={matchCount === 0}
            className="text-xs bg-primary text-primary-foreground"
          >
            Replace All ({matchCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
