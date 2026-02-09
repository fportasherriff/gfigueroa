-- Allow authenticated users to delete their own tickets
CREATE POLICY "Users can delete their own tickets"
ON public.support_tickets
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to delete any ticket
CREATE POLICY "Admins can delete any ticket"
ON public.support_tickets
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- Also allow deleting comments when ticket is deleted
CREATE POLICY "Users can delete their own comments"
ON public.ticket_comments
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.ticket_comments
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));