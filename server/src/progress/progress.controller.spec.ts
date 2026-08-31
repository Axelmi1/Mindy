import { ForbiddenException } from '@nestjs/common';
import { ProgressController } from './progress.controller';

/**
 * Focused spec for the PDF export endpoint: it must be authenticated
 * and only allow a user to export their OWN progress report.
 */
describe('ProgressController — exportPdf', () => {
  const exportService = {
    generateProgressPdf: jest.fn(),
  };

  const controller = new ProgressController(
    {} as never,
    exportService as never,
    {} as never,
  );

  const makeRes = () => ({
    set: jest.fn(),
    end: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects export of another user\'s progress', async () => {
    const res = makeRes();

    await expect(
      controller.exportPdf(
        'user-b',
        { user: { userId: 'user-a' } },
        res as never,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(exportService.generateProgressPdf).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  it('rejects when no authenticated user is present', async () => {
    const res = makeRes();

    await expect(
      controller.exportPdf('user-a', {}, res as never),
    ).rejects.toThrow(ForbiddenException);

    expect(exportService.generateProgressPdf).not.toHaveBeenCalled();
  });

  it('streams the PDF when the user exports their own progress', async () => {
    const res = makeRes();
    const pdf = Buffer.from('%PDF-fake');
    exportService.generateProgressPdf.mockResolvedValue(pdf);

    await controller.exportPdf(
      'user-a',
      { user: { userId: 'user-a' } },
      res as never,
    );

    expect(exportService.generateProgressPdf).toHaveBeenCalledWith('user-a');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalledWith(pdf);
  });
});
