import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders content correctly', () => {
    render(<MarkdownPreview content="Hello World" />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Hello World');
  });

  it('renders markdown headings', () => {
    render(<MarkdownPreview content="# Heading 1" />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Heading 1');
  });

  it('renders markdown with formatting', () => {
    render(<MarkdownPreview content="**bold text**" />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('**bold text**');
  });

  it('renders empty string', () => {
    render(<MarkdownPreview content="" />);
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MarkdownPreview content="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies prose styling classes', () => {
    const { container } = render(<MarkdownPreview content="Test" />);
    expect(container.firstChild).toHaveClass('prose');
    expect(container.firstChild).toHaveClass('prose-sm');
  });

  it('renders lists', () => {
    const content = `- Item 1\n- Item 2\n- Item 3`;
    render(<MarkdownPreview content={content} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Item 1');
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Item 2');
  });

  it('renders code blocks', () => {
    const content = '```js\nconst x = 1;\n```';
    render(<MarkdownPreview content={content} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('const x = 1;');
  });

  it('renders inline code', () => {
    render(<MarkdownPreview content="`inline code`" />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('inline code');
  });

  it('renders tables', () => {
    const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    render(<MarkdownPreview content={content} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Header 1');
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Cell 1');
  });

  it('renders long content', () => {
    const longContent = 'Lorem ipsum '.repeat(100);
    render(<MarkdownPreview content={longContent} />);
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });
});
