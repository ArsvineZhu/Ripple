import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  | 'asked'
  | 'userText'
  | 'setUserText'
  | 'setAsked'
  | 'askAI'
  | 'textColor'
  | 'theme'
  | 'bgColor'
  | 'aiAnswer'
  | 'setAIAnswer'
>;
export function AssistantTab({
  asked,
  userText,
  setUserText,
  setAsked,
  askAI,
  textColor,
  theme,
  bgColor,
  aiAnswer,
  setAIAnswer,
}: Props) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AnimatePresence propagate mode="wait">
        {!asked ? (
          <motion.div
            key="ask"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: '10px',
              boxSizing: 'border-box',
            }}
          >
            <textarea
              id="userinput"
              placeholder="Ask Anything"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setAsked(true);
                  askAI();
                }
              }}
              style={{
                color: `${textColor}`,
                fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                pointerEvents: 'auto',
                animation: 'none',
              }}
            />
            <button
              id="chatsubmit"
              onClick={() => {
                setAsked(true);
                askAI();
              }}
              style={{
                backgroundColor: textColor,
                color: bgColor,
                fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                pointerEvents: 'auto',
                animation: 'none',
              }}
            >
              Ask
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: '0 10px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              id="result"
              style={{
                fontWeight: 400,
                fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                pointerEvents: 'auto',
                animation: 'none',
                margin: 0,
                paddingTop: '40px',
                paddingBottom: '50px',
                maxHeight: '100%',
                overflowY: 'auto',
              }}
            >
              {aiAnswer ? (
                <ReactMarkdown
                  components={{
                    pre: ({ node, children, ...props }) => {
                      const code = node?.children[0];
                      const child = code?.type === 'element' ? code.children[0] : undefined;
                      const codeContent = child?.type === 'text' ? child.value : '';

                      return (
                        <div
                          style={{
                            position: 'relative',
                            margin: '10px 0',
                            backgroundColor: `color-mix(in srgb, ${textColor}, transparent 92%)`,
                            borderRadius: '8px',
                            border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(codeContent);
                              const btn = e.currentTarget;
                              const originalText = btn.innerText;
                              btn.innerText = 'Copied!';
                              btn.style.backgroundColor = 'rgba(52, 199, 89, 0.4)';
                              setTimeout(() => {
                                btn.innerText = originalText;
                                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                              }, 2000);
                            }}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              zIndex: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.15)',
                              border: 'none',
                              borderRadius: '5px',
                              color: textColor,
                              fontSize: '10px',
                              padding: '3px 7px',
                              cursor: 'pointer',
                              backdropFilter: 'blur(4px)',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            Copy
                          </button>
                          <pre
                            {...props}
                            style={{ margin: 0, padding: '12px', background: 'none' }}
                          >
                            {children}
                          </pre>
                        </div>
                      );
                    },
                    code: ({ node: _node, ...props }) => (
                      <code
                        {...props}
                        style={{
                          backgroundColor: 'transparent',
                          padding: '0',
                          borderRadius: '0',
                          fontFamily: 'monospace',
                          fontSize: '1em',
                        }}
                      />
                    ),
                  }}
                >
                  {aiAnswer}
                </ReactMarkdown>
              ) : (
                <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Thinking...</span>
              )}
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setAsked(false);
                setAIAnswer(null);
                setUserText('');
              }}
              id="Askanotherbtn"
              style={{
                position: 'absolute',
                bottom: 15,
                right: 15,
                backgroundColor: textColor,
                color: bgColor,
                fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                pointerEvents: 'auto',
                animation: 'none',
                zIndex: 999,
                cursor: 'pointer',
              }}
            >
              Ask another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
